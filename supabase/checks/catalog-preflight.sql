-- Read-only. Run again immediately before separately approved application.
-- Review conflicts and every Storage policy; do not use `supabase db push` blindly.
-- Existing signup SQL was applied manually and is not registered in CLI history.
begin transaction read only;
select current_database() as database_name,current_setting('server_version') as postgres_version;
select n.nspname,c.relname,c.relkind,c.relrowsecurity,obj_description(c.oid,'pg_class') as migration_marker
  from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where (n.nspname='public' and c.relname in ('categories','colors','product_styles','products','product_variants','product_images'))
    or (n.nspname='storage' and c.relname in ('buckets','objects'))
  order by n.nspname,c.relname;
select table_schema,table_name,column_name,data_type,is_nullable,column_default,is_identity
  from information_schema.columns where table_schema='public'
    and table_name in ('categories','colors','product_styles','products','product_variants','product_images')
  order by table_name,ordinal_position;
select n.nspname,t.typname,t.typtype from pg_type t join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typname in ('categories','colors','product_styles','products','product_variants','product_images');
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,p.prosecdef
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='private' and p.proname='set_catalog_updated_at')
    or (n.nspname='storage' and p.proname='protect_delete');
select n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid
  join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (
    (n.nspname='public' and c.relname in ('categories','colors','product_styles','products','product_variants','product_images'))
    or (n.nspname='storage' and c.relname in ('buckets','objects')));
select id,name,public,file_size_limit,allowed_mime_types from storage.buckets
  where id in ('product-images','category-images') or name in ('product-images','category-images');
select bucket_id,count(*) as recorded_objects from storage.objects
  where bucket_id in ('product-images','category-images') group by bucket_id;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies
  where (schemaname='storage' and tablename in ('buckets','objects'))
    or (schemaname='public' and tablename in ('categories','colors','product_styles','products','product_variants','product_images'))
  order by schemaname,tablename,policyname;
select table_schema,table_name,grantee,privilege_type from information_schema.role_table_grants
  where (table_schema='storage' and table_name in ('buckets','objects'))
    or (table_schema='public' and table_name in ('categories','colors','product_styles','products','product_variants','product_images'))
  order by table_schema,table_name,grantee,privilege_type;
select rolname,rolsuper,rolbypassrls from pg_roles where rolname in ('anon','authenticated','service_role');
select member_role.rolname as member_of,member.rolname as member
  from pg_auth_members membership join pg_roles member_role on member_role.oid=membership.roleid
    join pg_roles member on member.oid=membership.member
  where member.rolname in ('anon','authenticated','service_role');
select to_regclass('supabase_migrations.schema_migrations') as cli_migration_history_table;
do $$
declare history jsonb;
begin
  if to_regclass('supabase_migrations.schema_migrations') is null then
    raise notice 'schema_migrations is absent; manually applied migrations still need review.';
  else
    execute 'select coalesce(jsonb_agg(jsonb_build_object(''version'',to_jsonb(m)->>''version'',''name'',to_jsonb(m)->>''name'')),''[]''::jsonb)
      from supabase_migrations.schema_migrations m' into history;
    raise notice 'schema_migrations (version/name only): %',history;
  end if;
end $$;
commit;
