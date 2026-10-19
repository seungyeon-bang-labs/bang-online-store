-- Separate approval required. Empty owned tables only; never delete seed rows
-- or existing catalog/member data. No DROP CASCADE or automatic data recovery.
begin;
set local lock_timeout='5s';
lock table public.product_stats,public.discounts,public.discount_items,public.product_sections,public.product_section_items
  in access exclusive mode;
do $$
declare target text; has_rows boolean;
begin
  foreach target in array array['product_stats','discounts','discount_items','product_sections','product_section_items'] loop
    if obj_description(to_regclass('public.'||target),'pg_class') is distinct from 'bang_merchandising_20261019000000' then
      raise exception 'MERCHANDISING_ROLLBACK_OBJECT_REVIEW_REQUIRED: %',target;
    end if;
    execute format('select exists (select 1 from public.%I)',target) into has_rows;
    if has_rows then raise exception 'MERCHANDISING_ROLLBACK_NOT_EMPTY: %',target; end if;
  end loop;
  if obj_description(to_regprocedure('private.set_merchandising_updated_at()'),'pg_proc')
    is distinct from 'bang_merchandising_20261019000000' then
    raise exception 'MERCHANDISING_ROLLBACK_FUNCTION_REVIEW_REQUIRED';
  end if;
end $$;
drop table public.product_section_items;
drop table public.product_sections;
drop table public.discount_items;
drop table public.discounts;
drop table public.product_stats;
drop function private.set_merchandising_updated_at();
-- The private schema and all previously existing objects remain intact.
commit;
