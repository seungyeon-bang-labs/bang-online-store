-- Preparation only. Review merchandising-preflight.sql and obtain separate
-- approval before applying to Supabase. No seed rows or existing object changes.
begin;
set local lock_timeout='5s';

do $$
declare already_recorded boolean;
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in
      ('product_stats','discounts','discount_items','product_sections','product_section_items')
  ) or exists (
    select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname in
      ('product_stats','discounts','discount_items','product_sections','product_section_items')
  ) or exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname='set_merchandising_updated_at'
  ) then
    raise exception 'MERCHANDISING_MIGRATION_OBJECT_EXISTS';
  end if;
  if to_regclass('public.products') is null or not exists (
    select 1 from pg_class where oid=to_regclass('public.products') and relrowsecurity
  ) or not exists (
    select 1 from information_schema.columns where table_schema='public'
      and table_name='products' and column_name='id' and data_type='bigint'
  ) then
    raise exception 'MERCHANDISING_CATALOG_REVIEW_REQUIRED';
  end if;
  if (select count(*) from pg_roles where rolname in ('anon','authenticated','service_role'))<>3
    or exists (select 1 from pg_roles where rolname in ('anon','authenticated') and (rolsuper or rolbypassrls)) then
    raise exception 'MERCHANDISING_ROLE_REVIEW_REQUIRED';
  end if;
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select exists (select 1 from supabase_migrations.schema_migrations where version=$1)'
      into already_recorded using '20261019000000';
    if already_recorded then raise exception 'MERCHANDISING_HISTORY_REVIEW_REQUIRED'; end if;
  end if;
end $$;

create table public.product_stats (
  product_id bigint primary key references public.products(id) on delete restrict,
  total_sales integer not null default 0 check (total_sales>=0),
  today_sales integer not null default 0 check (today_sales>=0),
  weekly_sales integer not null default 0 check (weekly_sales>=0),
  monthly_sales integer not null default 0 check (monthly_sales>=0),
  updated_at timestamptz not null default now()
);

create table public.discounts (
  id bigint primary key check (id>0),
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at<ends_at)
);

create table public.discount_items (
  discount_id bigint not null references public.discounts(id) on delete restrict,
  product_id bigint not null references public.products(id) on delete restrict,
  discount_rate integer not null check (discount_rate between 1 and 100),
  primary key (discount_id,product_id)
);
create index discount_items_product_id_idx on public.discount_items(product_id);

create table public.product_sections (
  id bigint primary key check (id>0),
  title text not null,
  display_order integer not null default 0 check (display_order>=0),
  desktop_rows integer not null check (desktop_rows>0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_section_items (
  section_id bigint not null references public.product_sections(id) on delete restrict,
  product_id bigint not null references public.products(id) on delete restrict,
  display_order integer not null check (display_order>=0),
  primary key (section_id,product_id),
  unique (section_id,display_order)
);

comment on table public.product_stats is 'bang_merchandising_20261019000000';
comment on table public.discounts is 'bang_merchandising_20261019000000';
comment on table public.discount_items is 'bang_merchandising_20261019000000';
comment on table public.product_sections is 'bang_merchandising_20261019000000';
comment on table public.product_section_items is 'bang_merchandising_20261019000000';

create schema if not exists private;
create function private.set_merchandising_updated_at() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin
  new.updated_at:=now();
  return new;
end $$;
revoke all on function private.set_merchandising_updated_at() from public,anon,authenticated;
comment on function private.set_merchandising_updated_at() is 'bang_merchandising_20261019000000';
create trigger product_stats_updated_at before update on public.product_stats
  for each row execute function private.set_merchandising_updated_at();
create trigger discounts_updated_at before update on public.discounts
  for each row execute function private.set_merchandising_updated_at();
create trigger product_sections_updated_at before update on public.product_sections
  for each row execute function private.set_merchandising_updated_at();

alter table public.product_stats enable row level security;
alter table public.discounts enable row level security;
alter table public.discount_items enable row level security;
alter table public.product_sections enable row level security;
alter table public.product_section_items enable row level security;

revoke all on public.product_stats,public.discounts,public.discount_items,public.product_sections,public.product_section_items
  from public,anon,authenticated;
grant select on public.product_stats,public.discounts,public.discount_items,public.product_sections,public.product_section_items
  to anon,authenticated;
grant select,insert,update,delete on public.product_stats,public.discounts,public.discount_items,public.product_sections,public.product_section_items
  to service_role;

create policy product_stats_active_read on public.product_stats for select to anon,authenticated
  using (exists (select 1 from public.products p where p.id=product_stats.product_id and p.state='active'));
create policy discounts_current_read on public.discounts for select to anon,authenticated
  using (is_active and starts_at<=now() and now()<ends_at);
create policy discount_items_current_read on public.discount_items for select to anon,authenticated
  using (
    exists (select 1 from public.discounts d where d.id=discount_items.discount_id
      and d.is_active and d.starts_at<=now() and now()<d.ends_at)
    and exists (select 1 from public.products p where p.id=discount_items.product_id and p.state='active')
  );
create policy product_sections_active_read on public.product_sections for select to anon,authenticated
  using (is_active);
create policy product_section_items_active_read on public.product_section_items for select to anon,authenticated
  using (
    exists (select 1 from public.product_sections s where s.id=product_section_items.section_id and s.is_active)
    and exists (select 1 from public.products p where p.id=product_section_items.product_id and p.state='active')
  );
commit;
