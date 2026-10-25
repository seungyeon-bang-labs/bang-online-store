-- Read-only inspection. Run again before separately approved Gate A application.
-- Review actual types, users policies/recursion, function ownership, grants and SQL history.
-- No member profiles, email addresses, Auth metadata or credentials are selected.
begin transaction read only;
select current_database() as database_name,current_setting('server_version') as postgres_version,
  current_setting('transaction_read_only') as read_only;
select n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relacl,
  obj_description(c.oid,'pg_class') as migration_marker
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where (n.nspname='public' and c.relname in ('users','products','product_variants','carts','cart_items','cart_operations'))
    or (n.nspname='auth' and c.relname='users')
  order by n.nspname,c.relname;
select table_schema,table_name,column_name,data_type,udt_schema,udt_name,is_nullable,column_default
  from information_schema.columns where
    (table_schema='public' and table_name in ('users','products','product_variants','carts','cart_items','cart_operations'))
    or (table_schema='auth' and table_name='users' and column_name in ('id','email_confirmed_at'))
  order by table_schema,table_name,ordinal_position;
select n.nspname,t.typname,t.typtype from pg_catalog.pg_type t
  join pg_catalog.pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typname in ('user_status','carts','cart_items','cart_operations');
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_userbyid(p.proowner) as owner,p.prosecdef,p.proconfig,p.proacl
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='public' and p.proname in ('get_cart','apply_cart_operation'))
    or (n.nspname='private' and p.proname in ('set_cart_updated_at','cart_integer','cart_uuid',
      'cart_normalize_operation','cart_member','cart_lock','cart_lock_catalog','cart_cleanup','cart_snapshot'))
    or (n.nspname='auth' and p.proname='uid');
select n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid) as definition
  from pg_catalog.pg_trigger t join pg_catalog.pg_class c on c.oid=t.tgrelid
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where not t.tgisinternal and ((n.nspname='public' and c.relname in ('users','carts','cart_items','cart_operations'))
    or (n.nspname='auth' and c.relname='users'));
select n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid) as definition
  from pg_catalog.pg_constraint k join pg_catalog.pg_class c on c.oid=k.conrelid
  join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('users','products','product_variants','carts','cart_items','cart_operations');
select schemaname,tablename,indexname,indexdef from pg_indexes
  where schemaname='public' and tablename in ('carts','cart_items','cart_operations');
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies
  where (schemaname='public' and tablename in ('users','products','product_variants','carts','cart_items','cart_operations'))
    or (schemaname='auth' and tablename='users')
  order by schemaname,tablename,policyname;
select table_schema,table_name,grantee,privilege_type from information_schema.role_table_grants
  where table_schema='public' and table_name in ('users','carts','cart_items','cart_operations')
  order by table_schema,table_name,grantee,privilege_type;
select rolname,rolsuper,rolbypassrls from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role');
select parent.rolname as member_of,member.rolname as member
  from pg_catalog.pg_auth_members m join pg_catalog.pg_roles parent on parent.oid=m.roleid
  join pg_catalog.pg_roles member on member.oid=m.member
  where member.rolname in ('anon','authenticated','service_role');
select to_regclass('supabase_migrations.schema_migrations') as cli_migration_history_table;
do $$
declare history jsonb;
begin
  if to_regclass('supabase_migrations.schema_migrations') is null then
    raise notice 'schema_migrations is absent; manually applied SQL history must be reviewed.';
  else
    execute 'select coalesce(jsonb_agg(jsonb_build_object(''version'',to_jsonb(m)->>''version'',''name'',to_jsonb(m)->>''name'')),''[]''::jsonb)
      from supabase_migrations.schema_migrations m' into history;
    raise notice 'schema_migrations (version/name only): %',history;
  end if;
end $$;
commit;
