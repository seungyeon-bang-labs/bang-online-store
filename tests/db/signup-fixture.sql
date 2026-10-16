-- Isolated test database only. Mirrors the inspected public schema, not live Auth data.
create schema auth;
do $$ begin
  if not exists (select from pg_roles where rolname='bang_test_member') then create role bang_test_member; end if;
  if not exists (select from pg_roles where rolname='bang_test_auth_admin') then create role bang_test_auth_admin; end if;
end $$;
grant bang_test_member,bang_test_auth_admin to postgres;
create table auth.users (
  id uuid primary key, email text not null, email_confirmed_at timestamptz,
  raw_user_meta_data jsonb not null default '{}'
);
create type public.user_role as enum ('customer','admin');
create type public.user_status as enum ('active','suspended','deleted');
create table public.term_codes (id uuid primary key, code text unique not null, is_active boolean not null);
create table public.terms (
  id uuid primary key, term_code_id uuid references public.term_codes(id),
  is_active boolean not null, is_required boolean not null, effective_at timestamptz not null
);
create table public.users (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null, name text not null check (name=btrim(name) and char_length(name) between 1 and 50),
  phone_number text not null check (phone_number ~ '^01[016789][0-9]{7,8}$'),
  email_verified_at timestamptz, role public.user_role not null default 'customer',
  status public.user_status not null default 'active', deleted_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_term_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  term_id uuid not null references public.terms(id) on update cascade on delete restrict,
  consented_at timestamptz not null default now(), unique(user_id,term_id)
);
alter table public.users enable row level security;
alter table public.user_term_consents enable row level security;
create policy users_read_own on public.users for select to bang_test_member
  using (id=current_setting('request.jwt.claim.sub',true)::uuid);
grant select on public.users,public.user_term_consents to bang_test_member;
grant usage on schema auth to bang_test_auth_admin;
grant select,insert,update on auth.users to bang_test_auth_admin;
-- The migration revokes these ordinary Supabase role names too.
do $$ begin
  if not exists (select from pg_roles where rolname='anon') then create role anon; end if;
  if not exists (select from pg_roles where rolname='authenticated') then create role authenticated; end if;
end $$;
insert into public.term_codes values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','service',true),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','marketing',true);
insert into public.terms values
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true,true,'2020-01-01'),
 ('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true,false,'2020-01-01');
