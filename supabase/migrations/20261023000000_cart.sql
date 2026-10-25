-- Preparation only. Review checks/cart-preflight.sql and obtain Gate A approval before applying.
-- No member/catalog changes, seed data, or remote application.
begin;
set local lock_timeout='5s';

do $$
declare already_recorded boolean;
begin
  if exists (
    select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('carts','cart_items','cart_operations')
  ) or exists (
    select 1 from pg_catalog.pg_type t join pg_catalog.pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname in ('carts','cart_items','cart_operations')
  ) or exists (
    select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where (n.nspname='private' and p.proname in (
        'set_cart_updated_at','cart_integer','cart_uuid','cart_normalize_operation',
        'cart_member','cart_lock','cart_lock_catalog','cart_cleanup','cart_snapshot'))
      or (n.nspname='public' and p.proname in ('get_cart','apply_cart_operation'))
  ) then
    raise exception 'CART_MIGRATION_OBJECT_EXISTS';
  end if;
  if to_regclass('public.users') is null or to_regclass('auth.users') is null
    or to_regclass('public.products') is null or to_regclass('public.product_variants') is null
    or to_regprocedure('auth.uid()') is null then
    raise exception 'CART_MIGRATION_DEPENDENCY_REVIEW_REQUIRED';
  end if;
  if (select count(*) from pg_catalog.pg_attribute
      where attrelid='public.users'::regclass and not attisdropped and (
        (attname='id' and atttypid='uuid'::regtype)
        or (attname in ('email_verified_at','deleted_at') and atttypid='timestamptz'::regtype)
        or (attname='status' and atttypid=to_regtype('public.user_status'))))<>4
    or (select count(*) from pg_catalog.pg_attribute
      where attrelid='auth.users'::regclass and not attisdropped and (
        (attname='id' and atttypid='uuid'::regtype)
        or (attname='email_confirmed_at' and atttypid='timestamptz'::regtype)))<>2
    or (select count(*) from pg_catalog.pg_attribute
      where attrelid='public.product_variants'::regclass and not attisdropped and (
        (attname in ('id','product_id') and atttypid='bigint'::regtype)
        or (attname='stock' and atttypid='integer'::regtype)))<>3
    or (select count(*) from pg_catalog.pg_attribute
      where attrelid='public.products'::regclass and not attisdropped and (
        (attname in ('id','style_id') and atttypid='bigint'::regtype)
        or (attname='state' and atttypid='text'::regtype)))<>3 then
    raise exception 'CART_MIGRATION_COLUMN_REVIEW_REQUIRED';
  end if;
  if (select count(*) from pg_catalog.pg_roles where rolname in ('anon','authenticated'))<>2
    or exists (select 1 from pg_catalog.pg_roles where rolname in ('anon','authenticated') and (rolsuper or rolbypassrls)) then
    raise exception 'CART_MIGRATION_ROLE_REVIEW_REQUIRED';
  end if;
  if (select count(*) from pg_catalog.pg_class where relrowsecurity
      and oid in ('public.users'::regclass,'public.products'::regclass,'public.product_variants'::regclass))<>3
    or not has_table_privilege('authenticated','public.users','SELECT')
    or not has_function_privilege('authenticated','auth.uid()','EXECUTE') then
    raise exception 'CART_MIGRATION_ACCESS_REVIEW_REQUIRED';
  end if;
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select exists (select 1 from supabase_migrations.schema_migrations where version=$1)'
      into already_recorded using '20261023000000';
    if already_recorded then raise exception 'CART_MIGRATION_HISTORY_REVIEW_REQUIRED'; end if;
  end if;
end $$;

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete restrict,
  revision bigint not null default 0 check (revision>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_variant_id bigint not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id,product_variant_id)
);
create index cart_items_cart_id_order_idx on public.cart_items(cart_id,created_at,id);

create table public.cart_operations (
  cart_id uuid not null references public.carts(id) on delete restrict,
  request_id uuid not null,
  operation_type text not null check (operation_type in
    ('merge_guest','add_items','adjust_quantity','change_option','remove_items')),
  request_payload jsonb not null check (jsonb_typeof(request_payload)='object'),
  result jsonb not null check (jsonb_typeof(result)='object'),
  completed_at timestamptz not null default now(),
  primary key(cart_id,request_id)
);

comment on table public.carts is 'bang_cart_20261023000000';
comment on table public.cart_items is 'bang_cart_20261023000000';
comment on table public.cart_operations is 'bang_cart_20261023000000';

create schema if not exists private;
create function private.set_cart_updated_at() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin
  new.updated_at:=pg_catalog.now();
  return new;
end $$;
comment on function private.set_cart_updated_at() is 'bang_cart_20261023000000';
revoke all on function private.set_cart_updated_at() from public,anon,authenticated;
create trigger carts_updated_at before update on public.carts
  for each row execute function private.set_cart_updated_at();
create trigger cart_items_updated_at before update on public.cart_items
  for each row execute function private.set_cart_updated_at();

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.cart_operations enable row level security;
revoke all on public.carts,public.cart_items,public.cart_operations from public,anon,authenticated;
grant select on public.carts,public.cart_items,public.cart_operations to authenticated;

-- Depend on the existing own-member SELECT policy; do not replace users policies.
-- The signup confirmation trigger maintains email_verified_at. Task 3 RPCs also
-- verify the actual auth.users.email_confirmed_at before any read or mutation.
create policy carts_owner_read on public.carts for select to authenticated
  using (user_id=(select auth.uid()) and exists (
    select 1 from public.users u where u.id=(select auth.uid())
      and u.email_verified_at is not null and u.status='active' and u.deleted_at is null
  ));
create policy cart_items_owner_read on public.cart_items for select to authenticated
  using (exists (select 1 from public.carts c
    where c.id=cart_items.cart_id and c.user_id=(select auth.uid())));
create policy cart_operations_owner_read on public.cart_operations for select to authenticated
  using (exists (select 1 from public.carts c
    where c.id=cart_operations.cart_id and c.user_id=(select auth.uid())));
-- No INSERT/UPDATE/DELETE policies. Table grants also withhold TRUNCATE.

-- Validate numbers before casting them to storage types. JSON strings are not numbers.
create function private.cart_integer(p_value jsonb,p_max bigint) returns bigint
language plpgsql immutable set search_path=pg_catalog as $$
declare n numeric;
begin
  if jsonb_typeof(p_value) is distinct from 'number' then
    raise exception 'CART_INVALID_OPERATION' using errcode='22023';
  end if;
  n:=(p_value#>>'{}')::numeric;
  if n<>trunc(n) or n<1 or n>p_max then
    raise exception 'CART_INVALID_OPERATION' using errcode='22023';
  end if;
  return n::bigint;
end $$;

create function private.cart_uuid(p_value jsonb) returns uuid
language plpgsql immutable set search_path=pg_catalog as $$
begin
  if jsonb_typeof(p_value) is distinct from 'string'
    or (p_value#>>'{}') !~ '^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$' then
    raise exception 'CART_INVALID_OPERATION' using errcode='22023';
  end if;
  return (p_value#>>'{}')::uuid;
end $$;

create function private.cart_normalize_operation(p_value jsonb) returns jsonb
language plpgsql immutable set search_path=pg_catalog as $$
declare
  op jsonb;
  kind text;
  entry jsonb;
  entries jsonb:='[]';
  normalized jsonb;
  product_id bigint;
  variant_id bigint;
  quantity bigint;
begin
  if jsonb_typeof(p_value) is distinct from 'object' then
    raise exception 'CART_INVALID_OPERATION' using errcode='22023';
  end if;
  if p_value-array['version','operation']<>'{}'::jsonb
    or (p_value->'version') is distinct from '1'::jsonb
    or jsonb_typeof(p_value->'operation') is distinct from 'object' then
    raise exception 'CART_INVALID_OPERATION' using errcode='22023';
  end if;
  op:=p_value->'operation';
  kind:=op->>'kind';
  if kind in ('merge_guest','add_items') then
    if op-array['kind','items']<>'{}'::jsonb or jsonb_typeof(op->'items') is distinct from 'array' then
      raise exception 'CART_INVALID_OPERATION' using errcode='22023';
    end if;
    if jsonb_array_length(op->'items')=0 then
      raise exception 'CART_INVALID_OPERATION' using errcode='22023';
    end if;
    for entry in select value from jsonb_array_elements(op->'items') loop
      if jsonb_typeof(entry) is distinct from 'object' then
        raise exception 'CART_INVALID_OPERATION' using errcode='22023';
      end if;
      if entry-array['productId','variantId','quantity']<>'{}'::jsonb then
        raise exception 'CART_INVALID_OPERATION' using errcode='22023';
      end if;
      product_id:=private.cart_integer(entry->'productId',9007199254740991);
      variant_id:=private.cart_integer(entry->'variantId',9007199254740991);
      quantity:=private.cart_integer(entry->'quantity',2147483647);
      entries:=entries||jsonb_build_array(jsonb_build_object(
        'productId',product_id,'variantId',variant_id,'quantity',quantity));
    end loop;
    if exists (select 1 from jsonb_array_elements(entries) e
      group by (e->>'variantId')::bigint having sum((e->>'quantity')::bigint)>2147483647) then
      raise exception 'CART_INVALID_OPERATION' using errcode='22023';
    end if;
    select jsonb_agg(jsonb_build_object('productId',x.pid,'variantId',x.vid,'quantity',x.qty)
      order by x.vid,x.pid) into entries
      from (select (e->>'productId')::bigint pid,(e->>'variantId')::bigint vid,
        sum((e->>'quantity')::bigint)::integer qty from jsonb_array_elements(entries) e
        group by (e->>'productId')::bigint,(e->>'variantId')::bigint) x;
    normalized:=jsonb_build_object('kind',kind,'items',entries);
  elsif kind='adjust_quantity' then
    if op-array['kind','itemId','delta']<>'{}'::jsonb
      or (op->'delta') is null or (op->'delta') not in ('1'::jsonb,'-1'::jsonb) then
      raise exception 'CART_INVALID_OPERATION' using errcode='22023';
    end if;
    normalized:=jsonb_build_object('kind',kind,'itemId',private.cart_uuid(op->'itemId'),
      'delta',(op->>'delta')::numeric::integer);
  elsif kind='change_option' then
    if op-array['kind','itemId','productId','variantId']<>'{}'::jsonb then
      raise exception 'CART_INVALID_OPERATION' using errcode='22023';
    end if;
    normalized:=jsonb_build_object('kind',kind,'itemId',private.cart_uuid(op->'itemId'),
      'productId',private.cart_integer(op->'productId',9007199254740991),
      'variantId',private.cart_integer(op->'variantId',9007199254740991));
  elsif kind='remove_items' then
    if op-array['kind','itemIds']<>'{}'::jsonb or jsonb_typeof(op->'itemIds') is distinct from 'array' then
      raise exception 'CART_INVALID_OPERATION' using errcode='22023';
    end if;
    if jsonb_array_length(op->'itemIds')=0 then
      raise exception 'CART_INVALID_OPERATION' using errcode='22023';
    end if;
    select jsonb_agg(to_jsonb(x.id) order by x.id) into entries
      from (select distinct private.cart_uuid(value) id from jsonb_array_elements(op->'itemIds')) x;
    normalized:=jsonb_build_object('kind',kind,'itemIds',entries);
  else
    raise exception 'CART_INVALID_OPERATION' using errcode='22023';
  end if;
  return jsonb_build_object('version',1,'operation',normalized);
end $$;

create function private.cart_member(p_expected_user_id uuid) returns uuid
language plpgsql set search_path=pg_catalog as $$
declare
  owner_id uuid:=auth.uid();
  confirmed timestamptz;
  member public.users%rowtype;
begin
  if owner_id is null or p_expected_user_id is distinct from owner_id then
    raise exception 'CART_ACCESS_DENIED' using errcode='42501';
  end if;
  -- Match the existing Auth-trigger order: Auth first, then the store member.
  select a.email_confirmed_at into confirmed from auth.users a where a.id=owner_id for share;
  if not found or confirmed is null then
    raise exception 'CART_ACCESS_DENIED' using errcode='42501';
  end if;
  select u.* into member from public.users u where u.id=owner_id for share;
  if not found or member.status<>'active' or member.deleted_at is not null or member.email_verified_at is null then
    raise exception 'CART_ACCESS_DENIED' using errcode='42501';
  end if;
  return owner_id;
end $$;

create function private.cart_lock(p_user_id uuid) returns uuid
language plpgsql set search_path=pg_catalog as $$
declare cart_id uuid;
begin
  insert into public.carts(user_id) values (p_user_id) on conflict (user_id) do nothing;
  select c.id into cart_id from public.carts c where c.user_id=p_user_id for update;
  return cart_id;
end $$;

create function private.cart_lock_catalog(p_cart_id uuid,p_payload jsonb) returns void
language plpgsql set search_path=pg_catalog as $$
declare ids bigint[];
begin
  select coalesce(array_agg(x.id),'{}'::bigint[]) into ids from (
    select i.product_variant_id id from public.cart_items i where i.cart_id=p_cart_id
    union select (value->>'variantId')::bigint from
      jsonb_array_elements(coalesce(p_payload#>'{operation,items}','[]'::jsonb))
    union select (p_payload#>>'{operation,variantId}')::bigint
      where p_payload#>>'{operation,variantId}' is not null
  ) x;
  -- Shared validation locks, never stock reservations. Every RPC uses this order.
  perform v.id from public.product_variants v where v.id=any(ids) order by v.id for share;
  perform p.id from public.products p where p.id in (
    select v.product_id from public.product_variants v where v.id=any(ids)
  ) order by p.id for share;
end $$;

create function private.cart_cleanup(p_cart_id uuid) returns jsonb
language plpgsql set search_path=pg_catalog as $$
declare
  line record;
  changed boolean:=false;
  notices jsonb:='[]';
begin
  for line in select i.id,i.product_variant_id,i.quantity,v.stock,p.state
    from public.cart_items i left join public.product_variants v on v.id=i.product_variant_id
    left join public.products p on p.id=v.product_id where i.cart_id=p_cart_id order by i.id loop
    if line.state is distinct from 'active' then
      delete from public.cart_items where id=line.id and cart_id=p_cart_id;
      changed:=true;
      notices:=notices||jsonb_build_array(jsonb_build_object('kind','unavailable',
        'itemId',line.id,'variantId',line.product_variant_id,'before',line.quantity,'after',0));
    elsif line.stock>0 and line.quantity>line.stock then
      update public.cart_items set quantity=line.stock where id=line.id and cart_id=p_cart_id;
      changed:=true;
      notices:=notices||jsonb_build_array(jsonb_build_object('kind','quantity_adjusted',
        'itemId',line.id,'variantId',line.product_variant_id,'before',line.quantity,'after',line.stock));
    end if;
  end loop;
  return jsonb_build_object('changed',changed,'notices',notices);
end $$;

create function private.cart_snapshot(p_cart_id uuid,p_notices jsonb,p_result jsonb) returns jsonb
language sql volatile set search_path=pg_catalog as $$
  select jsonb_build_object('owner_id',c.user_id,'cart_id',c.id,'revision',c.revision::text,
    'items',coalesce((select jsonb_agg(jsonb_build_object(
      'id',i.id,'product_id',v.product_id,'product_variant_id',i.product_variant_id,'quantity',i.quantity)
      order by i.created_at,i.id) from public.cart_items i
      join public.product_variants v on v.id=i.product_variant_id where i.cart_id=c.id),'[]'::jsonb),
    'notices',p_notices,'operation',p_result)
  from public.carts c where c.id=p_cart_id
$$;

create function public.get_cart(p_expected_user_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare
  cart_id uuid;
  owner_id uuid;
  cleaned jsonb;
begin
  owner_id:=private.cart_member(p_expected_user_id);
  cart_id:=private.cart_lock(owner_id);
  perform private.cart_lock_catalog(cart_id,null);
  cleaned:=private.cart_cleanup(cart_id);
  if (cleaned->>'changed')::boolean then
    update public.carts c set revision=c.revision+1 where c.id=cart_id;
  end if;
  return private.cart_snapshot(cart_id,cleaned->'notices',null);
end $$;

create function public.apply_cart_operation(p_expected_user_id uuid,p_request_id uuid,p_operation jsonb) returns jsonb
language plpgsql security definer set search_path=pg_catalog as $$
declare
  owner_id uuid;
  v_cart_id uuid;
  canonical jsonb;
  op jsonb;
  kind text;
  receipt public.cart_operations%rowtype;
  existing public.cart_items%rowtype;
  source record;
  target record;
  entry jsonb;
  item_id uuid;
  desired bigint;
  next_quantity integer;
  affected integer;
  changed boolean:=false;
  accepted boolean:=false;
  notices jsonb:='[]';
  item_map jsonb:='{}';
  cleaned jsonb;
  result jsonb;
begin
  owner_id:=private.cart_member(p_expected_user_id);
  perform private.cart_uuid(to_jsonb(p_request_id));
  canonical:=private.cart_normalize_operation(p_operation);
  op:=canonical->'operation';
  kind:=op->>'kind';
  v_cart_id:=private.cart_lock(owner_id);
  select r.* into receipt from public.cart_operations r
    where r.cart_id=v_cart_id and r.request_id=p_request_id;
  if found then
    if receipt.operation_type<>kind or receipt.request_payload<>canonical then
      raise exception 'CART_REQUEST_CONFLICT' using errcode='P0001';
    end if;
    perform private.cart_lock_catalog(v_cart_id,null);
    cleaned:=private.cart_cleanup(v_cart_id);
    if (cleaned->>'changed')::boolean then
      update public.carts c set revision=c.revision+1 where c.id=v_cart_id;
    end if;
    return private.cart_snapshot(v_cart_id,
      coalesce(receipt.result->'notices','[]'::jsonb)||(cleaned->'notices'),receipt.result);
  end if;
  perform private.cart_lock_catalog(v_cart_id,canonical);
  if kind in ('merge_guest','add_items') then
    for entry in select value from jsonb_array_elements(op->'items') loop
      select v.id,v.product_id,v.stock,p.state into target from public.product_variants v
        join public.products p on p.id=v.product_id where v.id=(entry->>'variantId')::bigint;
      if not found or target.product_id<>(entry->>'productId')::bigint or target.state<>'active' then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','unavailable',
          'variantId',(entry->>'variantId')::bigint));
        continue;
      end if;
      select i.* into existing from public.cart_items i
        where i.cart_id=v_cart_id and i.product_variant_id=target.id;
      if target.stock=0 and kind='add_items' then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','sold_out','variantId',target.id));
        continue;
      end if;
      desired:=coalesce(existing.quantity,0)::bigint+(entry->>'quantity')::bigint;
      if desired>2147483647 then raise exception 'CART_INVALID_OPERATION' using errcode='22023'; end if;
      next_quantity:=case when target.stock=0 then desired::integer else least(desired,target.stock)::integer end;
      accepted:=true;
      if existing.id is null then
        insert into public.cart_items(cart_id,product_variant_id,quantity)
          values (v_cart_id,target.id,next_quantity) returning id into item_id;
        changed:=true;
      else
        item_id:=existing.id;
        if existing.quantity<>next_quantity then
          update public.cart_items set quantity=next_quantity where id=existing.id and cart_id=v_cart_id;
          changed:=true;
        end if;
      end if;
      if desired<>next_quantity then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','quantity_adjusted',
          'variantId',target.id,'itemId',item_id,'before',desired,'after',next_quantity));
      end if;
    end loop;
  elsif kind='adjust_quantity' then
    select i.id,i.quantity,i.product_variant_id,v.stock,p.state into source from public.cart_items i
      join public.product_variants v on v.id=i.product_variant_id join public.products p on p.id=v.product_id
      where i.cart_id=v_cart_id and i.id=(op->>'itemId')::uuid;
    if not found then
      accepted:=true;
      notices:=notices||jsonb_build_array(jsonb_build_object('kind','item_missing','itemId',(op->>'itemId')::uuid));
    elsif source.state<>'active' or source.stock=0 then
      notices:=notices||jsonb_build_array(jsonb_build_object(
        'kind',case when source.stock=0 and source.state='active' then 'sold_out' else 'unavailable' end,
        'itemId',source.id,'variantId',source.product_variant_id));
    else
      desired:=greatest(1,source.quantity::bigint+(op->>'delta')::integer);
      if desired>2147483647 then raise exception 'CART_INVALID_OPERATION' using errcode='22023'; end if;
      next_quantity:=least(desired,source.stock)::integer;
      accepted:=true;
      if next_quantity<>source.quantity then
        update public.cart_items set quantity=next_quantity where id=source.id and cart_id=v_cart_id;
        changed:=true;
      end if;
      if desired<>next_quantity then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','quantity_adjusted',
          'itemId',source.id,'variantId',source.product_variant_id,'before',desired,'after',next_quantity));
      end if;
    end if;
  elsif kind='change_option' then
    select i.id,i.quantity,i.product_variant_id,p.style_id,p.state into source from public.cart_items i
      join public.product_variants v on v.id=i.product_variant_id join public.products p on p.id=v.product_id
      where i.cart_id=v_cart_id and i.id=(op->>'itemId')::uuid;
    if not found then
      accepted:=true;
      notices:=notices||jsonb_build_array(jsonb_build_object('kind','item_missing','itemId',(op->>'itemId')::uuid));
    else
      select v.id,v.product_id,v.stock,p.style_id,p.state into target from public.product_variants v
        join public.products p on p.id=v.product_id where v.id=(op->>'variantId')::bigint;
      if not found or source.state<>'active' or target.state<>'active' or target.stock=0
        or target.product_id<>(op->>'productId')::bigint or target.style_id<>source.style_id then
        notices:=notices||jsonb_build_array(jsonb_build_object('kind','option_rejected',
          'itemId',source.id,'variantId',(op->>'variantId')::bigint));
      elsif source.product_variant_id=target.id then
        accepted:=true;
      else
        select i.* into existing from public.cart_items i
          where i.cart_id=v_cart_id and i.product_variant_id=target.id;
        desired:=source.quantity::bigint+coalesce(existing.quantity,0)::bigint;
        if desired>2147483647 then raise exception 'CART_INVALID_OPERATION' using errcode='22023'; end if;
        next_quantity:=least(desired,target.stock)::integer;
        if existing.id is null then
          insert into public.cart_items(cart_id,product_variant_id,quantity)
            values (v_cart_id,target.id,next_quantity) returning id into item_id;
        else
          item_id:=existing.id;
          if existing.quantity<>next_quantity then
            update public.cart_items set quantity=next_quantity where id=existing.id and cart_id=v_cart_id;
          end if;
        end if;
        delete from public.cart_items where id=source.id and cart_id=v_cart_id;
        item_map:=jsonb_build_object(source.id::text,item_id::text);
        accepted:=true;
        changed:=true;
        if desired<>next_quantity then
          notices:=notices||jsonb_build_array(jsonb_build_object('kind','quantity_adjusted',
            'itemId',item_id,'variantId',target.id,'before',desired,'after',next_quantity));
        end if;
      end if;
    end if;
  elsif kind='remove_items' then
    delete from public.cart_items i where i.cart_id=v_cart_id and i.id in (
      select (value#>>'{}')::uuid from jsonb_array_elements(op->'itemIds'));
    get diagnostics affected=row_count;
    changed:=affected>0;
    accepted:=true;
  end if;
  -- A move uses the latest stored source quantity; cleanup applies to the result.
  cleaned:=private.cart_cleanup(v_cart_id);
  notices:=notices||(cleaned->'notices');
  if changed or (cleaned->>'changed')::boolean then
    update public.carts c set revision=c.revision+1 where c.id=v_cart_id;
  end if;
  result:=jsonb_build_object('requestId',p_request_id,
    'outcome',case when changed then 'applied' when accepted then 'noop' else 'rejected' end,
    'itemIdMap',item_map,'notices',notices);
  insert into public.cart_operations(cart_id,request_id,operation_type,request_payload,result)
    values (v_cart_id,p_request_id,kind,canonical,result);
  return private.cart_snapshot(v_cart_id,notices,result);
end $$;

comment on function private.cart_integer(jsonb,bigint) is 'bang_cart_20261023000000';
comment on function private.cart_uuid(jsonb) is 'bang_cart_20261023000000';
comment on function private.cart_normalize_operation(jsonb) is 'bang_cart_20261023000000';
comment on function private.cart_member(uuid) is 'bang_cart_20261023000000';
comment on function private.cart_lock(uuid) is 'bang_cart_20261023000000';
comment on function private.cart_lock_catalog(uuid,jsonb) is 'bang_cart_20261023000000';
comment on function private.cart_cleanup(uuid) is 'bang_cart_20261023000000';
comment on function private.cart_snapshot(uuid,jsonb,jsonb) is 'bang_cart_20261023000000';
comment on function public.get_cart(uuid) is 'bang_cart_20261023000000';
comment on function public.apply_cart_operation(uuid,uuid,jsonb) is 'bang_cart_20261023000000';
revoke all on function private.cart_integer(jsonb,bigint),private.cart_uuid(jsonb),
  private.cart_normalize_operation(jsonb),private.cart_member(uuid),private.cart_lock(uuid),
  private.cart_lock_catalog(uuid,jsonb),private.cart_cleanup(uuid),private.cart_snapshot(uuid,jsonb,jsonb),
  public.get_cart(uuid),public.apply_cart_operation(uuid,uuid,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.get_cart(uuid),public.apply_cart_operation(uuid,uuid,jsonb) to authenticated;
commit;
