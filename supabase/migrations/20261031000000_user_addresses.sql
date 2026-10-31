-- Preparation only. Review checks/user-addresses-preflight.sql and obtain approval before applying.
-- No member/catalog/cart changes and no seed data; seeds/20261031000000_user_addresses.sql is separate.
begin;
set local lock_timeout='5s';

do $$
declare already_recorded boolean;
begin
  if exists (
    select 1 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname='user_addresses'
  ) or exists (
    select 1 from pg_catalog.pg_type t join pg_catalog.pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='user_addresses'
  ) or exists (
    select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname in ('user_address_before_write','user_address_before_delete')
  ) then
    raise exception 'USER_ADDRESS_MIGRATION_OBJECT_EXISTS';
  end if;
  if to_regclass('public.users') is null or to_regprocedure('auth.uid()') is null then
    raise exception 'USER_ADDRESS_MIGRATION_DEPENDENCY_REVIEW_REQUIRED';
  end if;
  if (select count(*) from pg_catalog.pg_attribute
      where attrelid='public.users'::regclass and not attisdropped and (
        (attname='id' and atttypid='uuid'::regtype)
        or (attname in ('email_verified_at','deleted_at') and atttypid='timestamptz'::regtype)
        or (attname='status' and atttypid=to_regtype('public.user_status'))))<>4 then
    raise exception 'USER_ADDRESS_MIGRATION_COLUMN_REVIEW_REQUIRED';
  end if;
  if (select count(*) from pg_catalog.pg_roles where rolname in ('anon','authenticated'))<>2
    or exists (select 1 from pg_catalog.pg_roles where rolname in ('anon','authenticated') and (rolsuper or rolbypassrls)) then
    raise exception 'USER_ADDRESS_MIGRATION_ROLE_REVIEW_REQUIRED';
  end if;
  if not (select relrowsecurity from pg_catalog.pg_class where oid='public.users'::regclass)
    or not has_table_privilege('authenticated','public.users','SELECT')
    or not has_function_privilege('authenticated','auth.uid()','EXECUTE') then
    raise exception 'USER_ADDRESS_MIGRATION_ACCESS_REVIEW_REQUIRED';
  end if;
  if to_regclass('supabase_migrations.schema_migrations') is not null then
    execute 'select exists (select 1 from supabase_migrations.schema_migrations where version=$1)'
      into already_recorded using '20261031000000';
    if already_recorded then raise exception 'USER_ADDRESS_MIGRATION_HISTORY_REVIEW_REQUIRED'; end if;
  end if;
end $$;

create table public.user_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  label text check (label is null or (btrim(label)<>'' and char_length(label)<=30)),
  recipient_name text not null check (btrim(recipient_name)<>'' and char_length(recipient_name)<=50),
  phone_number text not null check (btrim(phone_number)<>'' and char_length(phone_number)<=30),
  postal_code text not null check (postal_code ~ '^[0-9]{5}$'),
  address_line_1 text not null check (btrim(address_line_1)<>'' and char_length(address_line_1)<=200),
  address_line_2 text check (address_line_2 is null or (btrim(address_line_2)<>'' and char_length(address_line_2)<=200)),
  delivery_note text check (delivery_note is null or (btrim(delivery_note)<>'' and char_length(delivery_note)<=200)),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index user_addresses_one_default_idx on public.user_addresses(user_id) where is_default;
create index user_addresses_user_order_idx on public.user_addresses(user_id,created_at desc,id);
comment on table public.user_addresses is 'bang_user_addresses_20261031000000';

create schema if not exists private;
-- Runs as the caller, so RLS still limits the default switch to the caller's own rows.
-- The member lock serializes concurrent first inserts and default changes. Other edits skip
-- it, so an edit holding the current default's row lock never waits behind a default switch.
create function private.user_address_before_write() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin
  if tg_op='INSERT' or new.is_default<>old.is_default then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('user_addresses:'||new.user_id::text,0));
  end if;
  if tg_op='UPDATE' then
    new.updated_at:=pg_catalog.now();
    if old.is_default and not new.is_default and pg_catalog.pg_trigger_depth()=1 then
      raise exception 'USER_ADDRESS_DEFAULT_REQUIRED' using errcode='23514';
    end if;
  elsif not new.is_default and not exists (
    select 1 from public.user_addresses where user_id=new.user_id and is_default
  ) then
    new.is_default:=true;
  end if;
  if new.is_default and (tg_op='INSERT' or not old.is_default) then
    update public.user_addresses set is_default=false
      where user_id=new.user_id and is_default and id<>new.id;
  end if;
  return new;
end $$;
create function private.user_address_before_delete() returns trigger
language plpgsql set search_path=pg_catalog as $$
begin
  if old.is_default then
    raise exception 'USER_ADDRESS_DEFAULT_DELETE' using errcode='23514';
  end if;
  return old;
end $$;
comment on function private.user_address_before_write() is 'bang_user_addresses_20261031000000';
comment on function private.user_address_before_delete() is 'bang_user_addresses_20261031000000';
revoke all on function private.user_address_before_write(),private.user_address_before_delete()
  from public,anon,authenticated;
create trigger user_addresses_before_write before insert or update on public.user_addresses
  for each row execute function private.user_address_before_write();
create trigger user_addresses_before_delete before delete on public.user_addresses
  for each row execute function private.user_address_before_delete();

alter table public.user_addresses enable row level security;
revoke all on public.user_addresses from public,anon,authenticated;
grant select,delete on public.user_addresses to authenticated;
grant insert (user_id,label,recipient_name,phone_number,postal_code,address_line_1,address_line_2,delivery_note,is_default)
  on public.user_addresses to authenticated;
grant update (label,recipient_name,phone_number,postal_code,address_line_1,address_line_2,delivery_note,is_default)
  on public.user_addresses to authenticated;

-- Depend on the existing own-member SELECT policy; do not replace users policies.
create policy user_addresses_owner_all on public.user_addresses for all to authenticated
  using (user_id=(select auth.uid()) and exists (
    select 1 from public.users u where u.id=(select auth.uid())
      and u.email_verified_at is not null and u.status='active' and u.deleted_at is null
  ))
  with check (user_id=(select auth.uid()) and exists (
    select 1 from public.users u where u.id=(select auth.uid())
      and u.email_verified_at is not null and u.status='active' and u.deleted_at is null
  ));
commit;
