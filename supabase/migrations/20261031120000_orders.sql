-- Preparation only. Review checks/orders-preflight.sql and obtain approval before applying.
-- No member/catalog/cart/address schema changes and no seed data.
begin;
set local lock_timeout='5s';

do $$
declare already_recorded boolean;
begin
  if exists (
    select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in
      ('orders','order_items','order_status_histories','order_payment_transactions')
  ) or exists (
    select 1 from pg_catalog.pg_type t join pg_catalog.pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname in ('order_status','order_payment_method',
      'orders','order_items','order_status_histories','order_payment_transactions')
  ) or exists (
    select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='private' and p.proname in ('order_confirm_payment','order_number'))
      or (n.nspname='public' and p.proname='place_order')
  ) then
    raise exception 'ORDER_MIGRATION_OBJECT_EXISTS';
  end if;
  if to_regclass('public.users') is null or to_regclass('public.carts') is null
    or to_regclass('public.cart_items') is null or to_regclass('public.user_addresses') is null
    or to_regclass('public.products') is null or to_regclass('public.product_variants') is null
    or to_regclass('public.product_styles') is null or to_regclass('public.colors') is null
    or to_regclass('public.discounts') is null or to_regclass('public.discount_items') is null
    or to_regprocedure('auth.uid()') is null or to_regprocedure('private.cart_member(uuid)') is null
    or to_regprocedure('private.cart_lock(uuid)') is null then
    raise exception 'ORDER_MIGRATION_DEPENDENCY_REVIEW_REQUIRED';
  end if;
  if (select count(*) from pg_catalog.pg_attribute
      where attrelid='public.product_variants'::regclass and not attisdropped and (
        (attname in ('id','product_id') and atttypid='bigint'::regtype)
        or (attname in ('stock','price_offset') and atttypid='integer'::regtype)
        or (attname='size' and atttypid='text'::regtype)))<>5
    or (select count(*) from pg_catalog.pg_attribute
      where attrelid='public.products'::regclass and not attisdropped and (
        (attname in ('id','style_id','color_id') and atttypid='bigint'::regtype)
        or (attname='price' and atttypid='integer'::regtype)
        or (attname in ('state','display_name') and atttypid='text'::regtype)))<>6
    or (select count(*) from pg_catalog.pg_attribute
      where attrelid='public.discount_items'::regclass and not attisdropped and (
        (attname in ('discount_id','product_id') and atttypid='bigint'::regtype)
        or (attname='discount_rate' and atttypid='integer'::regtype)))<>3
    or (select count(*) from pg_catalog.pg_attribute
      where attrelid='public.discounts'::regclass and not attisdropped and (
        (attname in ('starts_at','ends_at') and atttypid='timestamptz'::regtype)
        or (attname='priority' and atttypid='integer'::regtype)
        or (attname='is_active' and atttypid='boolean'::regtype)))<>4 then
    raise exception 'ORDER_MIGRATION_COLUMN_REVIEW_REQUIRED';
  end if;
  if (select count(*) from pg_catalog.pg_roles where rolname in ('anon','authenticated'))<>2
    or exists (select 1 from pg_catalog.pg_roles where rolname in ('anon','authenticated') and (rolsuper or rolbypassrls)) then
    raise exception 'ORDER_MIGRATION_ROLE_REVIEW_REQUIRED';
  end if;
  if not (select relrowsecurity from pg_catalog.pg_class where oid='public.users'::regclass)
    or not has_table_privilege('authenticated','public.users','SELECT')
    or not has_function_privilege('authenticated','auth.uid()','EXECUTE') then
    raise exception 'ORDER_MIGRATION_ACCESS_REVIEW_REQUIRED';
  end if;
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select exists (select 1 from supabase_migrations.schema_migrations where version=$1)'
      into already_recorded using '20261031120000';
    if already_recorded then raise exception 'ORDER_MIGRATION_HISTORY_REVIEW_REQUIRED'; end if;
  end if;
end $$;

-- The accepted values live only here; generated types expose them as unions.
-- Adding bank transfer: ALTER TYPE public.order_payment_method ADD VALUE 'bank_transfer',
-- then a place_order branch that sets payment_due_at and records a pending_payment history,
-- and a confirmation path (admin or webhook) that calls private.order_confirm_payment.
create type public.order_status as enum
  ('pending_payment','payment_completed','shipping','delivered','cancelled');
create type public.order_payment_method as enum ('card');
comment on type public.order_status is 'bang_orders_20261031120000';
comment on type public.order_payment_method is 'bang_orders_20261031120000';

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique check (order_number ~ '^[0-9]{8}-[0-9]{6}$'),
  user_id uuid not null references public.users(id) on delete restrict,
  request_id uuid not null,
  status public.order_status not null,
  ordered_at timestamptz not null default now(),
  payment_due_at timestamptz,
  paid_at timestamptz,
  estimated_delivery_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  subtotal_amount integer not null check (subtotal_amount>=0),
  discount_amount integer not null check (discount_amount>=0 and discount_amount<=subtotal_amount),
  shipping_fee integer not null check (shipping_fee>=0),
  total_amount integer not null check (total_amount>=0),
  recipient_name text not null check (btrim(recipient_name)<>'' and char_length(recipient_name)<=50),
  recipient_phone text not null check (btrim(recipient_phone)<>'' and char_length(recipient_phone)<=30),
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  shipping_address_line_1 text not null
    check (btrim(shipping_address_line_1)<>'' and char_length(shipping_address_line_1)<=200),
  shipping_address_line_2 text check (shipping_address_line_2 is null
    or (btrim(shipping_address_line_2)<>'' and char_length(shipping_address_line_2)<=200)),
  delivery_note text check (delivery_note is null
    or (btrim(delivery_note)<>'' and char_length(delivery_note)<=200)),
  payment_method public.order_payment_method not null,
  unique(user_id,request_id),
  check (total_amount=subtotal_amount-discount_amount+shipping_fee),
  check (status<>'pending_payment' or payment_due_at is not null),
  check (status not in ('payment_completed','shipping','delivered') or paid_at is not null),
  check (status<>'delivered' or delivered_at is not null),
  check (status<>'cancelled' or cancelled_at is not null)
);
create index orders_user_ordered_at_idx on public.orders(user_id,ordered_at desc,id);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id bigint not null references public.products(id) on delete restrict,
  product_variant_id bigint not null references public.product_variants(id) on delete restrict,
  product_name text not null check (btrim(product_name)<>''),
  option_label text not null check (btrim(option_label)<>''),
  quantity integer not null check (quantity>0),
  unit_price integer not null check (unit_price>=0),
  discount_amount integer not null check (discount_amount>=0),
  line_total_amount integer not null check (line_total_amount>=0),
  created_at timestamptz not null default now(),
  unique(order_id,product_variant_id),
  check (line_total_amount::bigint=unit_price::bigint*quantity-discount_amount)
);

create table public.order_status_histories (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  status public.order_status not null,
  occurred_at timestamptz not null default now()
);
create index order_status_histories_order_idx on public.order_status_histories(order_id,occurred_at,id);

create table public.order_payment_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  type text not null check (type in ('payment','refund')),
  amount integer not null check (amount>0),
  payment_method public.order_payment_method not null,
  occurred_at timestamptz not null default now(),
  -- Method-specific receipts (e.g. a bank transfer account) go here, not in new columns.
  receipt_details jsonb check (receipt_details is null or jsonb_typeof(receipt_details)='object')
);
create index order_payment_transactions_order_idx on public.order_payment_transactions(order_id,occurred_at,id);

comment on table public.orders is 'bang_orders_20261031120000';
comment on table public.order_items is 'bang_orders_20261031120000';
comment on table public.order_status_histories is 'bang_orders_20261031120000';
comment on table public.order_payment_transactions is 'bang_orders_20261031120000';

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_histories enable row level security;
alter table public.order_payment_transactions enable row level security;
revoke all on public.orders,public.order_items,public.order_status_histories,public.order_payment_transactions
  from public,anon,authenticated;
grant select on public.orders,public.order_items,public.order_status_histories,public.order_payment_transactions
  to authenticated;

-- Depend on the existing own-member SELECT policy; do not replace users policies.
create policy orders_owner_read on public.orders for select to authenticated
  using (user_id=(select auth.uid()) and exists (
    select 1 from public.users u where u.id=(select auth.uid())
      and u.email_verified_at is not null and u.status='active' and u.deleted_at is null
  ));
create policy order_items_owner_read on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id=order_items.order_id));
create policy order_status_histories_owner_read on public.order_status_histories for select to authenticated
  using (exists (select 1 from public.orders o where o.id=order_status_histories.order_id));
create policy order_payment_transactions_owner_read on public.order_payment_transactions for select to authenticated
  using (exists (select 1 from public.orders o where o.id=order_payment_transactions.order_id));
-- No INSERT/UPDATE/DELETE policies; writes go through place_order only.

create schema if not exists private;

-- KST date plus six random digits; the unique constraint catches the rare collision.
create function private.order_number() returns text
language sql volatile set search_path=pg_catalog as $$
  select to_char(now() at time zone 'Asia/Seoul','YYYYMMDD')||'-'||
    lpad((floor(random()*1000000))::integer::text,6,'0')
$$;

-- Settles a pending order. Card orders call it inside place_order; a later bank transfer
-- confirmation (admin or webhook) calls it on its own. Never executable by members.
create function private.order_confirm_payment(p_order_id uuid,p_amount integer,
  p_occurred_at timestamptz,p_receipt_details jsonb) returns void
language plpgsql set search_path=pg_catalog as $$
declare target public.orders%rowtype;
begin
  select o.* into target from public.orders o where o.id=p_order_id for update;
  if not found or target.status<>'pending_payment' then
    raise exception 'ORDER_NOT_PAYABLE' using errcode='P0001';
  end if;
  if p_amount is distinct from target.total_amount or target.total_amount=0 then
    raise exception 'ORDER_PAYMENT_AMOUNT_MISMATCH' using errcode='P0001';
  end if;
  update public.orders set status='payment_completed',paid_at=p_occurred_at where id=p_order_id;
  insert into public.order_payment_transactions(order_id,type,amount,payment_method,occurred_at,receipt_details)
    values (p_order_id,'payment',p_amount,target.payment_method,p_occurred_at,p_receipt_details);
  insert into public.order_status_histories(order_id,status,occurred_at)
    values (p_order_id,'payment_completed',p_occurred_at);
end $$;

create function public.place_order(p_expected_user_id uuid,p_request_id uuid,p_cart_item_ids uuid[],
  p_address_id uuid,p_payment_method text,p_expected_total integer) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare
  owner_id uuid;
  v_cart_id uuid;
  requested uuid[];
  existing public.orders%rowtype;
  address public.user_addresses%rowtype;
  method public.order_payment_method;
  line record;
  unavailable jsonb:='[]';
  insufficient jsonb:='[]';
  v_subtotal bigint:=0;
  v_discount bigint:=0;
  v_shipping integer;
  v_total bigint;
  v_order_id uuid;
  v_order_number text;
  ordered timestamptz:=now();
  attempt integer:=0;
begin
  owner_id:=private.cart_member(p_expected_user_id);
  if p_request_id is null then
    raise exception 'ORDER_INVALID_REQUEST' using errcode='22023';
  end if;
  -- The cart row lock serializes every order and cart change for this member.
  v_cart_id:=private.cart_lock(owner_id);
  select o.* into existing from public.orders o where o.user_id=owner_id and o.request_id=p_request_id;
  if found then
    return jsonb_build_object('order_id',existing.id,'order_number',existing.order_number,
      'total_amount',existing.total_amount,'replayed',true);
  end if;

  begin
    method:=p_payment_method::public.order_payment_method;
  exception when invalid_text_representation then
    raise exception 'ORDER_PAYMENT_METHOD_UNAVAILABLE' using errcode='P0001';
  end;
  if method is null then
    raise exception 'ORDER_PAYMENT_METHOD_UNAVAILABLE' using errcode='P0001';
  end if;

  select coalesce(array_agg(distinct x),'{}') into requested from unnest(p_cart_item_ids) x where x is not null;
  if cardinality(requested)=0 or cardinality(requested)>100
    or cardinality(requested)<>cardinality(coalesce(p_cart_item_ids,'{}')) then
    raise exception 'ORDER_INVALID_REQUEST' using errcode='22023';
  end if;
  if (select count(*) from public.cart_items i where i.cart_id=v_cart_id and i.id=any(requested))
    <>cardinality(requested) then
    raise exception 'ORDER_CART_ITEM_NOT_FOUND' using errcode='P0001';
  end if;

  -- Same order as the cart RPCs: variants, then products. Stock rows are written, so lock for update.
  perform v.id from public.product_variants v where v.id in (
    select i.product_variant_id from public.cart_items i where i.cart_id=v_cart_id and i.id=any(requested)
  ) order by v.id for update;
  perform p.id from public.products p where p.id in (
    select v.product_id from public.cart_items i join public.product_variants v on v.id=i.product_variant_id
    where i.cart_id=v_cart_id and i.id=any(requested)
  ) order by p.id for share;

  select a.* into address from public.user_addresses a where a.id=p_address_id and a.user_id=owner_id;
  if not found then
    raise exception 'ORDER_ADDRESS_NOT_FOUND' using errcode='P0001';
  end if;
  -- Couriers reject a blank detail address.
  if address.address_line_2 is null then
    raise exception 'ORDER_ADDRESS_INCOMPLETE' using errcode='P0001';
  end if;

  -- Always qualified as pg_temp.order_lines so a same-named relation elsewhere is never read.
  create temporary table order_lines on commit drop as
  select i.id cart_item_id,v.product_id,v.id variant_id,i.quantity,v.stock,p.state,
    p.price,v.price_offset,
    coalesce(p.display_name,c.label||' '||s.name) product_name,
    c.label||' / '||v.size option_label,
    coalesce((select di.discount_rate from public.discount_items di
      join public.discounts d on d.id=di.discount_id
      where di.product_id=p.id and d.is_active and d.starts_at<=ordered and ordered<d.ends_at
      order by d.priority desc,d.id limit 1),0) discount_rate
  from public.cart_items i
  join public.product_variants v on v.id=i.product_variant_id
  join public.products p on p.id=v.product_id
  join public.product_styles s on s.id=p.style_id
  join public.colors c on c.id=p.color_id
  where i.cart_id=v_cart_id and i.id=any(requested);

  for line in select * from pg_temp.order_lines order by variant_id loop
    if line.state<>'active' then
      unavailable:=unavailable||jsonb_build_array(line.variant_id);
    elsif line.stock<line.quantity then
      insufficient:=insufficient||jsonb_build_array(line.variant_id);
    end if;
  end loop;
  if jsonb_array_length(unavailable)>0 then
    raise exception 'ORDER_PRODUCT_UNAVAILABLE' using errcode='P0001',
      detail=jsonb_build_object('variantIds',unavailable)::text;
  end if;
  if jsonb_array_length(insufficient)>0 then
    raise exception 'ORDER_OUT_OF_STOCK' using errcode='P0001',
      detail=jsonb_build_object('variantIds',insufficient)::text;
  end if;

  -- Same rule as getProductLinePrice and getOrderShippingFee: the discount applies to the base
  -- price only, the option offset is added undiscounted, and under 50,000원 costs 3,000원.
  select coalesce(sum((l.price+l.price_offset)::bigint*l.quantity),0),
    coalesce(sum((l.price-floor(l.price::numeric*(100-l.discount_rate)/100))::bigint*l.quantity),0)
    into v_subtotal,v_discount from pg_temp.order_lines l;
  v_shipping:=case when v_subtotal-v_discount=0 or v_subtotal-v_discount>=50000 then 0 else 3000 end;
  v_total:=v_subtotal-v_discount+v_shipping;
  if v_total>2147483647 then
    raise exception 'ORDER_INVALID_REQUEST' using errcode='22023';
  end if;
  -- A fully discounted order has nothing to pay; it needs its own flow, not a card payment.
  if v_total=0 then
    raise exception 'ORDER_ZERO_TOTAL' using errcode='P0001';
  end if;
  if p_expected_total is distinct from v_total then
    raise exception 'ORDER_PRICE_CHANGED' using errcode='P0001',
      detail=jsonb_build_object('totalAmount',v_total)::text;
  end if;

  loop
    attempt:=attempt+1;
    begin
      insert into public.orders(order_number,user_id,request_id,status,ordered_at,payment_due_at,
        subtotal_amount,discount_amount,shipping_fee,total_amount,recipient_name,recipient_phone,
        postal_code,shipping_address_line_1,shipping_address_line_2,delivery_note,payment_method)
      values (private.order_number(),owner_id,p_request_id,'pending_payment',ordered,ordered,
        v_subtotal,v_discount,v_shipping,v_total,address.recipient_name,address.phone_number,
        address.postal_code,address.address_line_1,address.address_line_2,address.delivery_note,method)
      returning id,order_number into v_order_id,v_order_number;
      exit;
    exception when unique_violation then
      if attempt>=5 then raise; end if;
    end;
  end loop;

  insert into public.order_items(order_id,product_id,product_variant_id,product_name,option_label,
    quantity,unit_price,discount_amount,line_total_amount,created_at)
  select v_order_id,l.product_id,l.variant_id,l.product_name,l.option_label,l.quantity,
    l.price+l.price_offset,
    ((l.price-floor(l.price::numeric*(100-l.discount_rate)/100))*l.quantity)::integer,
    ((floor(l.price::numeric*(100-l.discount_rate)/100)+l.price_offset)*l.quantity)::integer,
    ordered
  from pg_temp.order_lines l;

  update public.product_variants v set stock=v.stock-l.quantity
    from pg_temp.order_lines l where v.id=l.variant_id;
  delete from public.cart_items i where i.cart_id=v_cart_id and i.id=any(requested);
  update public.carts c set revision=c.revision+1 where c.id=v_cart_id;

  -- Card payments settle at checkout. See the enum comment above for adding bank transfer.
  if method='card' then
    perform private.order_confirm_payment(v_order_id,v_total::integer,ordered,null);
  end if;

  return jsonb_build_object('order_id',v_order_id,'order_number',v_order_number,
    'total_amount',v_total,'replayed',false);
end $$;

comment on function private.order_number() is 'bang_orders_20261031120000';
comment on function private.order_confirm_payment(uuid,integer,timestamptz,jsonb) is 'bang_orders_20261031120000';
comment on function public.place_order(uuid,uuid,uuid[],uuid,text,integer) is 'bang_orders_20261031120000';
revoke all on function private.order_number(),
  private.order_confirm_payment(uuid,integer,timestamptz,jsonb),
  public.place_order(uuid,uuid,uuid[],uuid,text,integer) from public,anon,authenticated;
grant execute on function public.place_order(uuid,uuid,uuid[],uuid,text,integer) to authenticated;
commit;
