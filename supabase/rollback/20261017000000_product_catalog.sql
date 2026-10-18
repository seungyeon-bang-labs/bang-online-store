-- Separate approval required. Removes only empty objects created by this catalog migration.
-- Never deletes Storage objects, catalog rows or member data; never uses DROP ... CASCADE.
-- Stop uploads and wait for in-flight Storage requests before running: SQL sees recorded metadata only.
begin;
set local lock_timeout='5s';
lock table public.categories,public.colors,public.product_styles,public.products,public.product_variants,public.product_images
  in access exclusive mode;
lock table storage.buckets,storage.objects in share row exclusive mode;
do $$
declare
  target text;
  has_rows boolean;
begin
  foreach target in array array['categories','colors','product_styles','products','product_variants','product_images'] loop
    if obj_description(to_regclass('public.'||target),'pg_class') is distinct from 'bang_catalog_20261017000000' then
      raise exception 'CATALOG_ROLLBACK_OBJECT_REVIEW_REQUIRED: %',target;
    end if;
    execute format('select exists (select 1 from public.%I)',target) into has_rows;
    if has_rows then raise exception 'CATALOG_ROLLBACK_NOT_EMPTY: %',target; end if;
  end loop;
  if exists (select 1 from storage.objects where bucket_id in ('product-images','category-images')) then
    raise exception 'CATALOG_ROLLBACK_NOT_EMPTY: Storage';
  end if;
  if (select count(*) from storage.buckets where id in ('product-images','category-images')
    and name=id and public and file_size_limit=5242880 and allowed_mime_types=array['image/png'])<>2 then
    raise exception 'CATALOG_ROLLBACK_BUCKET_REVIEW_REQUIRED';
  end if;
end $$;
drop policy catalog_objects_insert_guard on storage.objects;
drop policy catalog_objects_update_guard on storage.objects;
drop policy catalog_objects_delete_guard on storage.objects;
drop policy catalog_buckets_insert_guard on storage.buckets;
drop policy catalog_buckets_update_guard on storage.buckets;
drop policy catalog_buckets_delete_guard on storage.buckets;
-- Empty bucket metadata only; storage.objects is never deleted from here.
-- Supabase Storage 0055 guards direct DELETE statements, including empty buckets.
-- Opt in only inside this transaction after all locks and emptiness checks above.
set local storage.allow_delete_query='true';
delete from storage.buckets where id in ('product-images','category-images');
set local storage.allow_delete_query='false';
drop table public.product_images;
drop table public.product_variants;
drop table public.products;
drop table public.product_styles;
drop table public.colors;
drop table public.categories;
drop function private.set_catalog_updated_at();
-- The private schema can contain existing Auth functions and is deliberately retained.
commit;
