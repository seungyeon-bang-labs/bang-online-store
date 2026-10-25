-- Separate approval required. Only empty, migration-marked cart objects may be removed.
-- Never remove user/cart data or use DROP ... CASCADE; preserve Auth/catalog objects.
begin;
set local lock_timeout='5s';
lock table public.carts,public.cart_items,public.cart_operations in access exclusive mode;
do $$
declare
  target text;
  has_rows boolean;
  signature text;
begin
  foreach target in array array['carts','cart_items','cart_operations'] loop
    if obj_description(to_regclass('public.'||target),'pg_class') is distinct from 'bang_cart_20261023000000' then
      raise exception 'CART_ROLLBACK_OBJECT_REVIEW_REQUIRED: %',target;
    end if;
    execute format('select exists (select 1 from public.%I)',target) into has_rows;
    if has_rows then raise exception 'CART_ROLLBACK_NOT_EMPTY: %',target; end if;
  end loop;
  foreach signature in array array['private.set_cart_updated_at()','private.cart_integer(jsonb,bigint)',
    'private.cart_uuid(jsonb)','private.cart_normalize_operation(jsonb)','private.cart_member(uuid)',
    'private.cart_lock(uuid)','private.cart_lock_catalog(uuid,jsonb)','private.cart_cleanup(uuid)',
    'private.cart_snapshot(uuid,jsonb,jsonb)','public.get_cart(uuid)',
    'public.apply_cart_operation(uuid,uuid,jsonb)'] loop
    if obj_description(to_regprocedure(signature),'pg_proc') is distinct from 'bang_cart_20261023000000' then
      raise exception 'CART_ROLLBACK_OBJECT_REVIEW_REQUIRED: %',signature;
    end if;
  end loop;
end $$;
drop function public.apply_cart_operation(uuid,uuid,jsonb);
drop function public.get_cart(uuid);
drop function private.cart_snapshot(uuid,jsonb,jsonb);
drop function private.cart_cleanup(uuid);
drop function private.cart_lock_catalog(uuid,jsonb);
drop function private.cart_lock(uuid);
drop function private.cart_member(uuid);
drop function private.cart_normalize_operation(jsonb);
drop function private.cart_uuid(jsonb);
drop function private.cart_integer(jsonb,bigint);
drop table public.cart_operations;
drop table public.cart_items;
drop table public.carts;
drop function private.set_cart_updated_at();
-- The private schema may contain existing Auth/catalog functions and is retained.
commit;
