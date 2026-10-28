-- Test-only extension of catalog-fixture.sql in a bang-cart-test-* container.
-- Never apply to Supabase; preserves the original member name, hook and policy.
create schema auth;
grant usage on schema auth to anon,authenticated;
create table auth.users (
  id uuid primary key,
  email text not null,
  email_confirmed_at timestamptz
);
create function auth.uid() returns uuid language sql stable
  set search_path=pg_catalog as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
revoke all on function auth.uid() from public;
grant execute on function auth.uid() to anon,authenticated;

create type public.user_status as enum ('active','suspended','deleted');
insert into auth.users(id,email,email_confirmed_at) values
  ('00000000-0000-4000-8000-000000000001','a@example.test','2026-10-22'),
  ('00000000-0000-4000-8000-000000000002','b@example.test','2026-10-22'),
  ('00000000-0000-4000-8000-000000000003','missing@example.test','2026-10-22');
alter table public.users
  add column status public.user_status not null default 'active',
  add column deleted_at timestamptz,
  add column email_verified_at timestamptz,
  add constraint users_auth_fkey foreign key (id) references auth.users(id) on delete restrict;
update public.users set email_verified_at='2026-10-22';
insert into public.users(id,name,status,email_verified_at) values
  ('00000000-0000-4000-8000-000000000002','두 번째 회원','active','2026-10-22');
grant select on public.users to authenticated;
create policy cart_fixture_member_own_select on public.users for select to authenticated
  using (id=(select auth.uid()));
