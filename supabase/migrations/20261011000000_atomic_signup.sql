-- Apply only after reviewing signup-preflight.sql and coordinating the new app code.
-- Preserves existing member data, RLS, foreign keys, updated_at trigger and complete_signup.
begin;
lock table auth.users, public.users, public.user_term_consents in share row exclusive mode;

do $$
begin
  if exists (select 1 from auth.users a left join public.users u on u.id=a.id where u.id is null)
    or exists (select 1 from public.users u left join auth.users a on a.id=u.id where a.id is null)
    or exists (select 1 from public.users u join auth.users a on a.id=u.id
      where u.email is distinct from a.email or u.email_verified_at is distinct from a.email_confirmed_at) then
    raise exception 'SIGNUP_MIGRATION_MEMBER_REPAIR_REQUIRED';
  end if;
  if exists (select 1 from pg_catalog.pg_trigger
    where tgrelid='auth.users'::regclass and not tgisinternal) then
    raise exception 'SIGNUP_MIGRATION_AUTH_TRIGGER_REVIEW_REQUIRED';
  end if;
end $$;

create schema if not exists private;

create function private.register_store_member() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
declare
  metadata jsonb := new.raw_user_meta_data;
  member_name text;
  member_phone text;
  agreed_ids uuid[];
  displayed_ids uuid[];
  current_ids uuid[];
  required_ids uuid[];
  code_count bigint;
  ids jsonb;
begin
  if jsonb_typeof(metadata) is distinct from 'object'
    or jsonb_typeof(metadata->'name') is distinct from 'string'
    or jsonb_typeof(metadata->'phone_number') is distinct from 'string'
    or new.email is null or new.email='' then
    raise exception 'SIGNUP_VALIDATION_ERROR' using errcode='22023';
  end if;
  member_name := regexp_replace(metadata->>'name','^[[:space:]]+|[[:space:]]+$','','g');
  member_phone := regexp_replace(metadata->>'phone_number','[[:space:]-]','','g');
  if char_length(member_name) not between 1 and 50
    or member_phone !~ '^01[016789][0-9]{7,8}$' then
    raise exception 'SIGNUP_VALIDATION_ERROR' using errcode='22023';
  end if;

  foreach ids in array array[metadata->'agreed_term_ids',metadata->'displayed_term_ids'] loop
    if jsonb_typeof(ids) is distinct from 'array' then
      raise exception 'SIGNUP_VALIDATION_ERROR' using errcode='22023';
    end if;
    if jsonb_array_length(ids)>100 or exists (
      select 1 from jsonb_array_elements(ids) item
      where jsonb_typeof(item) is distinct from 'string'
        or (item#>>'{}') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ) then
      raise exception 'SIGNUP_VALIDATION_ERROR' using errcode='22023';
    end if;
    if exists (select 1 from jsonb_array_elements_text(ids) item
      group by item::uuid having count(*)>1) then
      raise exception 'SIGNUP_VALIDATION_ERROR' using errcode='22023';
    end if;
  end loop;
  select coalesce(array_agg(item::uuid order by item::uuid),'{}'::uuid[]) into agreed_ids
    from jsonb_array_elements_text(metadata->'agreed_term_ids') item;
  select coalesce(array_agg(item::uuid order by item::uuid),'{}'::uuid[]) into displayed_ids
    from jsonb_array_elements_text(metadata->'displayed_term_ids') item;

  -- Read one statement snapshot of the effective term set; terms must use immutable version IDs.
  select coalesce(array_agg(t.id order by t.id),'{}'::uuid[]),
    coalesce(array_agg(t.id order by t.id) filter (where t.is_required),'{}'::uuid[]),
    count(distinct c.code)
    into current_ids,required_ids,code_count
    from public.terms t join public.term_codes c on c.id=t.term_code_id
    where t.is_active and c.is_active and t.effective_at<=now();
  if cardinality(current_ids)=0 or code_count<>cardinality(current_ids)
    or displayed_ids is distinct from current_ids
    or not (agreed_ids <@ current_ids) or not (required_ids <@ agreed_ids) then
    raise exception 'SIGNUP_TERMS_CHANGED' using errcode='23514';
  end if;

  insert into public.users(id,email,name,phone_number,email_verified_at,role,status)
    values(new.id,new.email,member_name,member_phone,new.email_confirmed_at,'customer','active');
  insert into public.user_term_consents(user_id,term_id)
    select new.id,term_id from unnest(agreed_ids) term_id;
  -- No exception suppression or conflict upsert: a storage failure must roll back Auth too.
  return new;
end $$;

create function private.sync_store_email_confirmation() returns trigger
language plpgsql security definer set search_path=pg_catalog as $$
begin
  update public.users set email_verified_at=new.email_confirmed_at where id=new.id;
  if not found then
    raise exception 'SIGNUP_MEMBER_MISSING' using errcode='23514';
  end if;
  return new;
end $$;

revoke all on function private.register_store_member() from public,anon,authenticated;
revoke all on function private.sync_store_email_confirmation() from public,anon,authenticated;

create trigger store_member_on_auth_signup after insert on auth.users
  for each row execute function private.register_store_member();
create trigger store_member_on_email_confirmation after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function private.sync_store_email_confirmation();
commit;
