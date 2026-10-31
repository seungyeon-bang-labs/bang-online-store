-- Read-only inspection. Run before the separately approved user_addresses migration.
-- No member profiles, email addresses, Auth metadata or credentials are selected.
begin transaction read only;
select current_database() as database_name,current_setting('server_version') as postgres_version,
  current_setting('transaction_read_only') as read_only;
select n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relacl,
  obj_description(c.oid,'pg_class') as migration_marker
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('users','user_addresses');
select table_name,column_name,data_type,udt_name,is_nullable
  from information_schema.columns
  where table_schema='public' and table_name='users' and column_name in ('id','status','deleted_at','email_verified_at')
  order by column_name;
select n.nspname,t.typname,t.typtype from pg_catalog.pg_type t
  join pg_catalog.pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typname in ('user_status','user_addresses');
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_userbyid(p.proowner) as owner,p.prosecdef,p.proconfig,p.proacl
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='private' and p.proname in ('user_address_before_write','user_address_before_delete'))
    or (n.nspname='auth' and p.proname='uid');
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies
  where schemaname='public' and tablename in ('users','user_addresses')
  order by tablename,policyname;
select table_name,grantee,privilege_type from information_schema.role_table_grants
  where table_schema='public' and table_name in ('users','user_addresses')
  order by table_name,grantee,privilege_type;
select rolname,rolsuper,rolbypassrls from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role');
select to_regclass('supabase_migrations.schema_migrations') as cli_history_table;
select count(*) as demo_member_count from public.users
  where email='demo@example.com' and status='active' and deleted_at is null;
rollback;
