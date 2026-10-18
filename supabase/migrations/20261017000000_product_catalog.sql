-- Preparation only: review checks/catalog-preflight.sql and obtain separate approval before applying.
-- Explicit seed IDs; no sequences, member changes, seed rows or application repository changes.
begin;
set local lock_timeout='5s';

do $$
declare
  already_recorded boolean;
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in
      ('categories','colors','product_styles','products','product_variants','product_images')
  ) or exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname in
      ('categories','colors','product_styles','products','product_variants','product_images')
  ) or exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname='set_catalog_updated_at'
  ) then
    raise exception 'CATALOG_MIGRATION_OBJECT_EXISTS';
  end if;
  if to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null
    or (select count(*) from pg_class where oid in ('storage.buckets'::regclass,'storage.objects'::regclass)
      and relrowsecurity)<>2 then
    raise exception 'CATALOG_MIGRATION_STORAGE_RLS_REQUIRED';
  end if;
  if (select count(*) from pg_roles where rolname in ('anon','authenticated','service_role'))<>3
    or exists (select 1 from pg_roles where rolname in ('anon','authenticated') and (rolsuper or rolbypassrls)) then
    raise exception 'CATALOG_MIGRATION_ROLE_REVIEW_REQUIRED';
  end if;
  if exists (select 1 from storage.buckets
    where id in ('product-images','category-images') or name in ('product-images','category-images')) then
    raise exception 'CATALOG_MIGRATION_BUCKET_EXISTS';
  end if;
  if exists (select 1 from pg_policies where schemaname='storage' and (
    (tablename='objects' and policyname in ('catalog_objects_insert_guard','catalog_objects_update_guard','catalog_objects_delete_guard'))
    or (tablename='buckets' and policyname in ('catalog_buckets_insert_guard','catalog_buckets_update_guard','catalog_buckets_delete_guard'))
  )) then
    raise exception 'CATALOG_MIGRATION_POLICY_EXISTS';
  end if;
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select exists (select 1 from supabase_migrations.schema_migrations where version=$1)'
      into already_recorded using '20261017000000';
    if already_recorded then raise exception 'CATALOG_MIGRATION_HISTORY_REVIEW_REQUIRED'; end if;
  end if;
end $$;

create table public.categories (
  id text primary key,
  name text not null,
  slug text not null,
  parent_id text references public.categories(id) on delete restrict,
  image_path text,
  alt_text text,
  display_order integer not null default 0 check (display_order>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(parent_id,slug)
);
create unique index categories_root_slug_unique on public.categories(slug) where parent_id is null;

create table public.colors (
  id bigint primary key check (id>0),
  code text not null unique,
  label text not null,
  hex_code text not null
);

create table public.product_styles (
  id bigint primary key check (id>0),
  category_id text not null references public.categories(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index product_styles_category_id_idx on public.product_styles(category_id);

create table public.products (
  id bigint primary key check (id>0),
  style_id bigint not null references public.product_styles(id) on delete restrict,
  color_id bigint not null references public.colors(id) on delete restrict,
  display_name text,
  price integer not null check (price>=0),
  state text not null default 'active' check (state in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  restocked_at timestamptz,
  unique(style_id,color_id)
);
create index products_state_created_at_idx on public.products(state,created_at desc);

create table public.product_variants (
  id bigint primary key check (id>0),
  product_id bigint not null references public.products(id) on delete restrict,
  sku text not null unique,
  size text not null check (size in ('XS','S','M','L','XL','2XL','3XL','4XL','5XL')),
  stock integer not null default 0 check (stock>=0),
  price_offset integer not null default 0 check (price_offset>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id,size)
);
-- The product_id prefix of this unique index also supports product option lookups.

create table public.product_images (
  id bigint primary key check (id>0),
  product_id bigint not null references public.products(id) on delete restrict,
  image_path text not null,
  image_type text not null check (image_type in ('thumbnail','detail')),
  display_order integer not null default 0 check (display_order>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id,display_order)
);
create unique index product_images_one_thumbnail on public.product_images(product_id) where image_type='thumbnail';

-- Rollback only accepts objects marked as created by this migration.
comment on table public.categories is 'bang_catalog_20261017000000';
comment on table public.colors is 'bang_catalog_20261017000000';
comment on table public.product_styles is 'bang_catalog_20261017000000';
comment on table public.products is 'bang_catalog_20261017000000';
comment on table public.product_variants is 'bang_catalog_20261017000000';
comment on table public.product_images is 'bang_catalog_20261017000000';

create schema if not exists private;
create function private.set_catalog_updated_at() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin
  new.updated_at:=now();
  return new;
end $$;
revoke all on function private.set_catalog_updated_at() from public,anon,authenticated;
create trigger categories_updated_at before update on public.categories
  for each row execute function private.set_catalog_updated_at();
create trigger product_styles_updated_at before update on public.product_styles
  for each row execute function private.set_catalog_updated_at();
create trigger products_updated_at before update on public.products
  for each row execute function private.set_catalog_updated_at();
create trigger product_variants_updated_at before update on public.product_variants
  for each row execute function private.set_catalog_updated_at();
create trigger product_images_updated_at before update on public.product_images
  for each row execute function private.set_catalog_updated_at();

alter table public.categories enable row level security;
alter table public.colors enable row level security;
alter table public.product_styles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
revoke all on public.categories,public.colors,public.product_styles,public.products,public.product_variants,public.product_images
  from public,anon,authenticated;
grant select on public.categories,public.colors,public.product_styles,public.products,public.product_variants,public.product_images
  to anon,authenticated;
grant select,insert,update,delete on public.categories,public.colors,public.product_styles,public.products,public.product_variants,public.product_images
  to service_role;
create policy categories_public_read on public.categories for select to anon,authenticated using (true);
create policy colors_public_read on public.colors for select to anon,authenticated using (true);
create policy product_styles_public_read on public.product_styles for select to anon,authenticated using (true);
create policy products_active_read on public.products for select to anon,authenticated using (state='active');
create policy product_variants_active_read on public.product_variants for select to anon,authenticated
  using (exists (select 1 from public.products p where p.id=product_id and p.state='active'));
create policy product_images_active_read on public.product_images for select to anon,authenticated
  using (exists (select 1 from public.products p where p.id=product_id and p.state='active'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('product-images','product-images',true,5242880,array['image/png']),
  ('category-images','category-images',true,5242880,array['image/png']);
-- Public bucket URLs serve images without a SELECT policy. Do not broaden object listing.
-- Restrictive guards are ANDed with existing permissive policies. Other buckets retain their policies.
create policy catalog_objects_insert_guard on storage.objects as restrictive for insert to anon,authenticated
  with check (bucket_id not in ('product-images','category-images'));
create policy catalog_objects_update_guard on storage.objects as restrictive for update to anon,authenticated
  using (bucket_id not in ('product-images','category-images'))
  with check (bucket_id not in ('product-images','category-images'));
create policy catalog_objects_delete_guard on storage.objects as restrictive for delete to anon,authenticated
  using (bucket_id not in ('product-images','category-images'));
create policy catalog_buckets_insert_guard on storage.buckets as restrictive for insert to anon,authenticated
  with check (id not in ('product-images','category-images') and name not in ('product-images','category-images'));
create policy catalog_buckets_update_guard on storage.buckets as restrictive for update to anon,authenticated
  using (id not in ('product-images','category-images') and name not in ('product-images','category-images'))
  with check (id not in ('product-images','category-images') and name not in ('product-images','category-images'));
create policy catalog_buckets_delete_guard on storage.buckets as restrictive for delete to anon,authenticated
  using (id not in ('product-images','category-images') and name not in ('product-images','category-images'));
commit;
