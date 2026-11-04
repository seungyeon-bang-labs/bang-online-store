-- Separate approval required. Drops the discontinued cart line lookup.
-- Revert the app first: the app that keeps discontinued lines cannot load a cart without this function.
-- If 20261104010000_cart_keep_discontinued is applied, roll that back before this.
begin;
set local lock_timeout='5s';

do $$
begin
  if obj_description(to_regprocedure('public.get_discontinued_cart_lines(jsonb)'),'pg_proc')
    is distinct from 'bang_cart_discontinued_lines_20261104000000' then
    raise exception 'CART_DISCONTINUED_LINES_ROLLBACK_REVIEW_REQUIRED';
  end if;
  if obj_description(to_regprocedure('private.cart_cleanup(uuid)'),'pg_proc')
    = 'bang_cart_keep_discontinued_20261104010000' then
    raise exception 'CART_DISCONTINUED_LINES_ROLLBACK_ORDER';
  end if;
end $$;

drop function public.get_discontinued_cart_lines(jsonb);
commit;
