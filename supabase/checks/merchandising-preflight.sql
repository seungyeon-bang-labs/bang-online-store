-- Read-only. Review before separately approved schema/seed application.
-- Previous migrations were applied through SQL Editor; never blindly db push.
begin transaction read only;
select current_database() as database_name, current_setting('server_version') as postgres_version;

select n.nspname,c.relname,c.relkind,c.relrowsecurity,obj_description(c.oid,'pg_class') as migration_marker
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('products','product_stats','discounts','discount_items','product_sections','product_section_items')
order by c.relname;

select table_name,column_name,data_type,is_nullable,column_default,is_identity
from information_schema.columns where table_schema='public' and table_name in
 ('products','product_stats','discounts','discount_items','product_sections','product_section_items')
order by table_name,ordinal_position;

select n.nspname,t.typname,t.typtype
from pg_type t join pg_namespace n on n.oid=t.typnamespace
where n.nspname='public' and t.typname in
 ('product_stats','discounts','discount_items','product_sections','product_section_items');

select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,p.prosecdef
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='private' and p.proname in ('set_merchandising_updated_at','set_catalog_updated_at');

select n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid)
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
where not t.tgisinternal and n.nspname='public' and c.relname in
 ('products','product_stats','discounts','discount_items','product_sections','product_section_items');

select c.relname,con.conname,pg_get_constraintdef(con.oid)
from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('products','product_stats','discounts','discount_items','product_sections','product_section_items')
order by c.relname,con.conname;

select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
from pg_policies where schemaname='public' and tablename in
 ('products','product_stats','discounts','discount_items','product_sections','product_section_items');

select table_name,grantee,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name in
 ('products','product_stats','discounts','discount_items','product_sections','product_section_items')
order by table_name,grantee,privilege_type;

select rolname,rolsuper,rolbypassrls from pg_roles where rolname in ('anon','authenticated','service_role');
select count(*) as catalog_products from public.products;
select id,state from public.products where id between 1 and 27 order by id;

do $$
declare history jsonb;
begin
 if to_regclass('supabase_migrations.schema_migrations') is null then
   raise notice 'No CLI history table; review manually applied SQL in supabase/README.md.';
 else
   execute 'select coalesce(jsonb_agg(jsonb_build_object(''version'',to_jsonb(m)->>''version'',''name'',to_jsonb(m)->>''name'')),''[]''::jsonb) from supabase_migrations.schema_migrations m'
     into history;
   raise notice 'CLI history (version/name only): %',history;
 end if;
end $$;
commit;
