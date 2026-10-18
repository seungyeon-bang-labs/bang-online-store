-- Test-only schema in a bang-catalog-test-* container. Never run on Supabase.
-- This models Storage metadata/RLS, not the Storage HTTP service or file bytes.
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated; end if;
  if not exists (select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
end $$;
grant usage on schema public to anon,authenticated,service_role;
create schema storage;
grant usage on schema storage to anon,authenticated,service_role;
create table storage.buckets (
  id text primary key,
  name text unique not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);
create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id),
  name text not null,
  unique(bucket_id,name)
);
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;
-- Model Supabase Storage migration 0055's statement-level delete protection.
-- https://github.com/supabase/storage/blob/master/migrations/tenant/0055-prevent-direct-deletes.sql
create function storage.protect_delete() returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('storage.allow_delete_query',true),'false')<>'true' then
    raise exception 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
      using errcode='42501';
  end if;
  return null;
end $$;
create trigger protect_buckets_delete before delete on storage.buckets
  for each statement execute function storage.protect_delete();
create trigger protect_objects_delete before delete on storage.objects
  for each statement execute function storage.protect_delete();
-- Simulate broad pre-existing Storage grants and permissive policies.
grant all on storage.buckets,storage.objects to anon,authenticated,service_role;
create policy legacy_buckets_access on storage.buckets for all to anon,authenticated
  using (true) with check (true);
create policy legacy_objects_access on storage.objects for all to anon,authenticated
  using (true) with check (true);
insert into storage.buckets(id,name) values ('existing-bucket','existing-bucket');
insert into storage.objects(bucket_id,name) values ('existing-bucket','original.png');

-- Sentinels prove the catalog migration/rollback leaves member objects alone.
create schema private;
create table public.users (id uuid primary key, name text not null);
insert into public.users values ('00000000-0000-4000-8000-000000000001','기존 회원');
create function private.catalog_test_existing_member_hook() returns trigger
language plpgsql as $$ begin return new; end $$;
create trigger existing_member_hook before update on public.users
  for each row execute function private.catalog_test_existing_member_hook();
alter table public.users enable row level security;
create policy existing_member_read on public.users for select to authenticated using (false);
