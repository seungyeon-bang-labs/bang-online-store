-- Separate approval required. Only empty, migration-marked order tables may be removed.
-- Never remove order, member, catalog or cart data or use DROP ... CASCADE.
begin;
set local lock_timeout='5s';
lock table public.orders,public.order_items,public.order_status_histories,public.order_payment_transactions
  in access exclusive mode;
do $$
declare
  name text;
  signature text;
begin
  foreach name in array array['public.orders','public.order_items','public.order_status_histories',
      'public.order_payment_transactions'] loop
    if obj_description(name::regclass,'pg_class') is distinct from 'bang_orders_20261031120000' then
      raise exception 'ORDER_ROLLBACK_OBJECT_REVIEW_REQUIRED: %',name;
    end if;
  end loop;
  if exists (select 1 from public.orders) or exists (select 1 from public.order_items)
    or exists (select 1 from public.order_status_histories)
    or exists (select 1 from public.order_payment_transactions) then
    raise exception 'ORDER_ROLLBACK_NOT_EMPTY';
  end if;
  foreach signature in array array['private.order_number()',
      'private.order_confirm_payment(uuid,integer,timestamptz,jsonb)',
      'public.place_order(uuid,uuid,uuid[],uuid,text,integer)'] loop
    if obj_description(to_regprocedure(signature),'pg_proc') is distinct from 'bang_orders_20261031120000' then
      raise exception 'ORDER_ROLLBACK_OBJECT_REVIEW_REQUIRED: %',signature;
    end if;
  end loop;
  foreach name in array array['public.order_status','public.order_payment_method'] loop
    if obj_description(to_regtype(name),'pg_type') is distinct from 'bang_orders_20261031120000' then
      raise exception 'ORDER_ROLLBACK_OBJECT_REVIEW_REQUIRED: %',name;
    end if;
  end loop;
end $$;
drop function public.place_order(uuid,uuid,uuid[],uuid,text,integer);
drop function private.order_confirm_payment(uuid,integer,timestamptz,jsonb);
drop function private.order_number();
drop table public.order_payment_transactions;
drop table public.order_status_histories;
drop table public.order_items;
drop table public.orders;
drop type public.order_payment_method;
drop type public.order_status;
-- The private schema may contain existing Auth/catalog/cart/address functions and is retained.
commit;
