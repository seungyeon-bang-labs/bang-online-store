-- Read-only inspection. Run before the separately approved orders migration.
-- No member profiles, addresses, email addresses, Auth metadata or credentials are selected.
begin transaction read only;
select current_database() as database_name,current_setting('server_version') as postgres_version,
  current_setting('transaction_read_only') as read_only;
select n.nspname,c.relname,c.relkind,c.relrowsecurity,obj_description(c.oid,'pg_class') as migration_marker
  from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and c.relname in ('users','carts','cart_items','user_addresses','products',
    'product_variants','product_styles','colors','discounts','discount_items',
    'orders','order_items','order_status_histories','order_payment_transactions')
  order by c.relname;
select table_name,column_name,udt_name,is_nullable from information_schema.columns
  where table_schema='public' and (
    (table_name='product_variants' and column_name in ('id','product_id','stock','price_offset','size'))
    or (table_name='products' and column_name in ('id','style_id','color_id','price','state','display_name'))
    or (table_name='discount_items' and column_name in ('discount_id','product_id','discount_rate'))
    or (table_name='discounts' and column_name in ('starts_at','ends_at','priority','is_active')))
  order by table_name,column_name;
select n.nspname,t.typname,t.typtype from pg_catalog.pg_type t
  join pg_catalog.pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and t.typname in ('order_status','order_payment_method',
    'orders','order_items','order_status_histories','order_payment_transactions');
select n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) as arguments,
  pg_get_userbyid(p.proowner) as owner,p.prosecdef,p.proconfig,p.proacl
  from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid=p.pronamespace
  where (n.nspname='private' and p.proname in ('cart_member','cart_lock','order_number','order_confirm_payment'))
    or (n.nspname='public' and p.proname='place_order') or (n.nspname='auth' and p.proname='uid')
  order by n.nspname,p.proname;
select rolname,rolsuper,rolbypassrls from pg_catalog.pg_roles where rolname in ('anon','authenticated','service_role');
select to_regclass('supabase_migrations.schema_migrations') as cli_history_table;
select count(*) as active_products from public.products where state='active';
rollback;
