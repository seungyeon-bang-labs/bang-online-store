-- Read-only. Review immediately before applying the migration; do not display user credentials.
select
  (select count(*) from auth.users) as auth_users,
  (select count(*) from public.users) as members,
  (select count(*) from auth.users a left join public.users u on u.id=a.id where u.id is null) as auth_without_member,
  (select count(*) from public.users u left join auth.users a on a.id=u.id where a.id is null) as member_without_auth,
  (select count(*) from public.users u join auth.users a on a.id=u.id
    where u.email is distinct from a.email or u.email_verified_at is distinct from a.email_confirmed_at) as member_mismatch;
select t.tgname,pg_get_triggerdef(t.oid) from pg_trigger t
  where t.tgrelid in ('auth.users'::regclass,'public.users'::regclass) and not t.tgisinternal;
select schemaname,tablename,policyname,roles,cmd,qual,with_check from pg_policies
  where schemaname='public' and tablename in ('users','user_term_consents');
select c.code,count(*) as effective_versions from public.terms t join public.term_codes c on c.id=t.term_code_id
  where t.is_active and c.is_active and t.effective_at<=now() group by c.code having count(*)>1;
select r,t,has_table_privilege(r,t,'SELECT') as can_read,
  has_any_column_privilege(r,t,'INSERT') as can_insert,
  has_any_column_privilege(r,t,'UPDATE') as can_update,
  has_table_privilege(r,t,'DELETE') as can_delete
  from unnest(array['anon','authenticated']) r
  cross join unnest(array['public.users','public.user_term_consents']) t;
