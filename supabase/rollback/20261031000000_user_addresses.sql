-- Separate approval required. Only an empty, migration-marked user_addresses table may be removed.
-- Never remove member or address data or use DROP ... CASCADE.
begin;
set local lock_timeout='5s';
lock table public.user_addresses in access exclusive mode;
do $$
declare signature text;
begin
  if obj_description('public.user_addresses'::regclass,'pg_class') is distinct from 'bang_user_addresses_20261031000000' then
    raise exception 'USER_ADDRESS_ROLLBACK_OBJECT_REVIEW_REQUIRED: user_addresses';
  end if;
  if exists (select 1 from public.user_addresses) then
    raise exception 'USER_ADDRESS_ROLLBACK_NOT_EMPTY';
  end if;
  foreach signature in array array['private.user_address_before_write()','private.user_address_before_delete()'] loop
    if obj_description(to_regprocedure(signature),'pg_proc') is distinct from 'bang_user_addresses_20261031000000' then
      raise exception 'USER_ADDRESS_ROLLBACK_OBJECT_REVIEW_REQUIRED: %',signature;
    end if;
  end loop;
end $$;
drop table public.user_addresses;
drop function private.user_address_before_write();
drop function private.user_address_before_delete();
-- The private schema may contain existing Auth/catalog/cart functions and is retained.
commit;
