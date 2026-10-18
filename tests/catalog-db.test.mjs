import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const container = process.env.CATALOG_TEST_CONTAINER;
if (container) assert.match(container, /^bang-catalog-test-[a-z0-9-]+$/, 'Only isolated catalog test containers are allowed');
const options = { skip: !container && 'Set CATALOG_TEST_CONTAINER to an isolated bang-catalog-test-* container; never a remote database.' };
const baseline = process.env.CATALOG_TEST_SKIP_MIGRATION === '1';
const read = relative => readFileSync(new URL(relative, import.meta.url), 'utf8');
const migration = () => read('../supabase/migrations/20261017000000_product_catalog.sql');
const rollback = () => read('../supabase/rollback/20261017000000_product_catalog.sql');
const tables = ['categories', 'colors', 'product_styles', 'products', 'product_variants', 'product_images'];
let sequence = 0;

function docker(args, input) {
  return spawnSync('docker', args, { input, encoding: 'utf8', timeout: 30000 });
}
function sql(name, input, requireSuccess = true) {
  const result = docker(['exec', '-i', container, 'psql', '-X', '-A', '-t', '-U', 'postgres', '-d', name,
    '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-q'], input);
  if (requireSuccess) assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result;
}
function database(t, { migrate = true } = {}) {
  const name = `catalog_tests_${Date.now()}_${++sequence}`;
  const created = docker(['exec', container, 'createdb', '-U', 'postgres', name]);
  assert.equal(created.status, 0, created.stderr || created.error?.message);
  t.after(() => {
    const removed = docker(['exec', container, 'dropdb', '-U', 'postgres', name]);
    assert.equal(removed.status, 0, removed.stderr);
  });
  sql(name, read('./db/catalog-fixture.sql') + (migrate && !baseline ? migration() : ''));
  return name;
}
function reject(name, statement, pattern) {
  const result = sql(name, `begin;\n${statement}\nrollback;`, false);
  assert.notEqual(result.status, 0, statement);
  assert.match(result.stderr, pattern);
}
function as(role, statement) { return `set role ${role}; ${statement} reset role;`; }
// The real Storage API sets this flag before executing queries. Each test SQL call
// has its own short-lived psql session; catalog policies must still block writes.
function asStorageApi(role, statement) {
  return `set storage.allow_delete_query='true'; ${as(role, statement)}`;
}
function values(name, statement) { return sql(name, statement).stdout.trim(); }
const seed = `
  insert into public.categories(id,name,slug,parent_id,display_order) values
    ('coat','코트','coat',null,0),('jacket','자켓','jacket',null,1),
    ('coat-wool','울 코트','wool','coat',0),('jacket-wool','울 자켓','wool','jacket',0);
  insert into public.colors(id,code,label,hex_code) values (1,'GRAY','그레이','#888888'),(2,'BLACK','블랙','#000000');
  insert into public.product_styles(id,category_id,name) values (1,'coat-wool','코트'),(2,'jacket-wool','자켓');
  insert into public.products(id,style_id,color_id,price,state) values
    (1,1,1,100000,'active'),(2,1,2,110000,'inactive'),(3,2,1,90000,'active');
  insert into public.product_variants(id,product_id,sku,size,stock,price_offset) values
    (1,1,'1-GY-S','S',2,0),(2,1,'1-GY-M','M',0,1000),(3,2,'1-BK-M','M',5,0),(4,3,'2-GY-L','L',2,0);
  insert into public.product_images(id,product_id,image_path,image_type,display_order) values
    (1,1,'products/1/thumbnail.png','thumbnail',0),(2,1,'products/1/detail-1.png','detail',1),
    (3,2,'products/2/thumbnail.png','thumbnail',0);
`;

test('catalog schema accepts valid rows and uses explicit bigint IDs with timestamp defaults', options, t => {
  const name = database(t);
  sql(name, seed);
  assert.equal(values(name, 'select count(*) from public.products;'), '3');
  assert.equal(values(name, `select count(*) from information_schema.columns where table_schema='public'
    and table_name in ('colors','product_styles','products','product_variants','product_images')
    and column_name='id' and data_type='bigint' and column_default is null and is_identity='NO';`), '5');
  assert.equal(values(name, `select (created_at is not null and updated_at is not null) from public.categories limit 1;`), 't');
  assert.equal(values(name, `select count(*) from information_schema.columns where table_schema='public' and table_name='colors'
    and column_name in ('created_at','updated_at');`), '0');
  reject(name, "insert into public.colors(code,label,hex_code) values ('RED','빨강','#ff0000');", /23502/);
});

test('catalog constraints reject duplicates, invalid values and missing relations', options, t => {
  const name = database(t);
  sql(name, seed);
  const cases = [
    ["insert into public.categories(id,name,slug) values ('duplicate','중복','coat');", /23505/],
    ["insert into public.categories(id,name,slug,parent_id) values ('duplicate','중복','wool','coat');", /23505/],
    ["insert into public.colors values (9,'GRAY','중복','#888888');", /23505/],
    ["insert into public.products(id,style_id,color_id,price) values (9,1,1,1000);", /23505/],
    ["insert into public.product_variants(id,product_id,sku,size,stock,price_offset) values (9,3,'1-GY-S','S',1,0);", /23505/],
    ["insert into public.product_variants(id,product_id,sku,size,stock,price_offset) values (9,1,'unique','S',1,0);", /23505/],
    ["insert into public.product_images(id,product_id,image_path,image_type,display_order) values (9,1,'new.png','detail',1);", /23505/],
    ["insert into public.product_images(id,product_id,image_path,image_type,display_order) values (9,1,'new.png','thumbnail',2);", /23505/],
    ["update public.categories set display_order=-1 where id='coat';", /23514/],
    ['update public.products set price=-1 where id=1;', /23514/],
    ["update public.products set state='pending' where id=1;", /23514/],
    ['update public.product_variants set stock=-1 where id=1;', /23514/],
    ['update public.product_variants set price_offset=-1 where id=1;', /23514/],
    ["update public.product_variants set size='XXL' where id=1;", /23514/],
    ["update public.product_images set image_type='hero' where id=1;", /23514/],
    ['update public.product_images set display_order=-1 where id=1;', /23514/],
    ['update public.product_variants set product_id=999 where id=1;', /23503/],
    ['update public.products set color_id=999 where id=1;', /23503/],
    ['update public.products set style_id=999 where id=1;', /23503/],
    ["update public.product_styles set category_id='missing' where id=1;", /23503/],
    ["update public.categories set parent_id='missing' where id='coat';", /23503/],
    ['delete from public.products where id=1;', /23503/],
    ["delete from public.categories where id='coat';", /23503/],
  ];
  for (const [statement, pattern] of cases) reject(name, statement, pattern);
  for (const table of tables.filter(table => table !== 'categories')) {
    reject(name, `update public.${table} set id=0 where id=1;`, /23514/);
  }
});

test('updated_at triggers apply only to the five mutable catalog tables', options, t => {
  const name = database(t);
  sql(name, seed);
  for (const table of tables.filter(table => table !== 'colors')) {
    const id = table === 'categories' ? "'coat'" : '1';
    sql(name, `update public.${table} set updated_at='2000-01-01' where id=${id};`);
    assert.equal(values(name, `select updated_at>'2000-01-01' from public.${table} where id=${id};`), 't');
  }
  assert.equal(values(name, `select count(*) from pg_trigger where tgrelid='public.colors'::regclass and not tgisinternal;`), '0');
  assert.equal(values(name, `select has_function_privilege('anon','private.set_catalog_updated_at()','execute');`), 'f');
});

test('anonymous and authenticated reads expose only active products and their options/images', options, t => {
  const name = database(t);
  sql(name, seed);
  for (const role of ['anon', 'authenticated']) {
    assert.equal(values(name, as(role, `select (select count(*) from public.categories),
      (select count(*) from public.colors),(select count(*) from public.product_styles),
      (select count(*) from public.products),(select count(*) from public.product_variants),(select count(*) from public.product_images);`)), '4|2|2|2|3|2');
    assert.equal(values(name, as(role, 'select count(*) from public.product_variants where stock=0;')), '1');
  }
  assert.equal(values(name, as('service_role', 'select count(*) from public.products;')), '3');
});

test('ordinary catalog writes are denied by grants and remain denied by RLS if DML is granted', options, t => {
  const name = database(t);
  sql(name, seed);
  for (const role of ['anon', 'authenticated']) {
    for (const table of tables) {
      const id = table === 'categories' ? "'coat'" : '1';
      reject(name, as(role, `update public.${table} set id=id where id=${id};`), /42501/);
      reject(name, as(role, `delete from public.${table} where id=${id};`), /42501/);
    }
  }
  sql(name, `grant insert,update,delete on ${tables.map(table => `public.${table}`).join(',')} to anon,authenticated;`);
  for (const role of ['anon', 'authenticated']) {
    reject(name, as(role, "insert into public.colors(id,code,label,hex_code) values (9,'RED','빨강','#ff0000');"), /42501/);
    for (const table of tables) {
      assert.equal(values(name, as(role, `with changed as (update public.${table} set id=id returning id) select count(*) from changed;`)), '0');
      assert.equal(values(name, as(role, `with changed as (delete from public.${table} returning id) select count(*) from changed;`)), '0');
    }
  }
});

test('public buckets have PNG/5MiB restrictions and ordinary writes cannot bypass existing permissive Storage policies', options, t => {
  const name = database(t);
  assert.equal(values(name, `select count(*) from storage.buckets where id in ('product-images','category-images')
    and public and file_size_limit=5242880 and allowed_mime_types=array['image/png'];`), '2');
  sql(name, "insert into storage.objects(bucket_id,name) values ('product-images','protected.png'),('category-images','protected.png');");
  for (const role of ['anon', 'authenticated']) {
    for (const bucket of ['product-images', 'category-images']) {
      reject(name, asStorageApi(role, `insert into storage.objects(bucket_id,name) values ('${bucket}','blocked.png');`), /42501/);
      reject(name, asStorageApi(role, `update storage.objects set bucket_id='${bucket}' where bucket_id='existing-bucket';`), /42501/);
      assert.equal(values(name, asStorageApi(role, `with changed as (update storage.objects set name='changed.png' where bucket_id='${bucket}' returning id) select count(*) from changed;`)), '0');
      assert.equal(values(name, asStorageApi(role, `with changed as (delete from storage.objects where bucket_id='${bucket}' returning id) select count(*) from changed;`)), '0');
      assert.equal(values(name, asStorageApi(role, `with changed as (update storage.buckets set public=false where id='${bucket}' returning id) select count(*) from changed;`)), '0');
      assert.equal(values(name, asStorageApi(role, `with changed as (delete from storage.buckets where id='${bucket}' returning id) select count(*) from changed;`)), '0');
    }
    sql(name, asStorageApi(role, `insert into storage.objects(bucket_id,name) values ('existing-bucket','allowed-${role}.png');
      update storage.objects set name='updated-${role}.png' where name='allowed-${role}.png';
      delete from storage.objects where name='updated-${role}.png';`));
  }
  sql(name, as('service_role', "insert into storage.objects(bucket_id,name) values ('product-images','admin.png');"));
  assert.equal(values(name, "select count(*) from storage.objects where name='admin.png';"), '1');
});

test('migration refuses existing tables, types, functions, buckets or policy names without replacing them', options, async t => {
  const collisions = [
    ['table', 'create table public.categories (keep_me text);', /CATALOG_MIGRATION_OBJECT_EXISTS/],
    ['type', "create type public.products as enum ('keep_me');", /CATALOG_MIGRATION_OBJECT_EXISTS/],
    ['function', 'create function private.set_catalog_updated_at() returns trigger language plpgsql as $$ begin return new; end $$;', /CATALOG_MIGRATION_OBJECT_EXISTS/],
    ['bucket', "insert into storage.buckets(id,name) values ('product-images','product-images');", /CATALOG_MIGRATION_BUCKET_EXISTS/],
    ['policy', 'create policy catalog_objects_insert_guard on storage.objects for insert with check (true);', /CATALOG_MIGRATION_POLICY_EXISTS/],
    ['disabled RLS', 'alter table storage.objects disable row level security;', /CATALOG_MIGRATION_STORAGE_RLS_REQUIRED/],
  ];
  for (const [label, setup, error] of collisions) {
    await t.test(label, () => {
      const name = database(t, { migrate: false });
      sql(name, setup);
      const before = values(name, "select count(*) from pg_class where relnamespace='public'::regnamespace;");
      const result = sql(name, migration(), false);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, error);
      assert.equal(values(name, "select count(*) from pg_class where relnamespace='public'::regnamespace;"), before);
      assert.equal(values(name, "select count(*) from public.users;"), '1');
    });
  }
});

test('preflight is read-only and handles missing/present CLI migration history', options, t => {
  const name = database(t, { migrate: false });
  const check = () => sql(name, read('../supabase/checks/catalog-preflight.sql'));
  const before = values(name, 'select count(*) from pg_class;');
  assert.match(check().stdout + check().stderr, /schema_migrations/);
  assert.equal(values(name, 'select count(*) from pg_class;'), before);
  sql(name, "create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key,name text); insert into supabase_migrations.schema_migrations values ('20261011000000','existing signup');");
  assert.match(check().stdout + check().stderr, /20261011000000/);
  sql(name, migration());
  assert.match(check().stdout + check().stderr, /catalog_objects_insert_guard/);
});

test('rollback refuses catalog data or recorded Storage objects and preserves everything', options, async t => {
  for (const [label, data] of [
    ['catalog rows', seed],
    ['only colors', "insert into public.colors values (1,'GRAY','그레이','#888888');"],
    ['Storage objects', "insert into storage.objects(bucket_id,name) values ('product-images','keep.png');"],
  ]) {
    await t.test(label, () => {
      const name = database(t);
      sql(name, data);
      const result = sql(name, rollback(), false);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /CATALOG_ROLLBACK_NOT_EMPTY/);
      assert.equal(values(name, `select count(*) from pg_class where relnamespace='public'::regnamespace and relname in (${tables.map(table => `'${table}'`).join(',')});`), '6');
      assert.equal(values(name, "select count(*) from storage.buckets where id in ('product-images','category-images');"), '2');
      if (label === 'Storage objects') assert.equal(values(name, "select count(*) from storage.objects where name='keep.png';"), '1');
    });
  }
});

test('empty rollback removes only this migration and keeps member objects and unrelated Storage policies/data', options, t => {
  const name = database(t);
  const before = values(name, "select pg_get_functiondef('private.catalog_test_existing_member_hook()'::regprocedure);");
  const result = sql(name, rollback() + "select current_setting('storage.allow_delete_query',true) is distinct from 'true';");
  assert.equal(result.stdout.trim(), 't', 'Delete opt-in must not survive rollback transaction completion');
  assert.equal(values(name, `select count(*) from pg_class where relnamespace='public'::regnamespace and relname in (${tables.map(table => `'${table}'`).join(',')});`), '0');
  assert.equal(values(name, "select to_regprocedure('private.set_catalog_updated_at()') is null;"), 't');
  assert.equal(values(name, 'select count(*) from public.users;'), '1');
  assert.equal(values(name, "select pg_get_functiondef('private.catalog_test_existing_member_hook()'::regprocedure);"), before);
  assert.equal(values(name, "select count(*) from pg_trigger where tgrelid='public.users'::regclass and not tgisinternal;"), '1');
  assert.equal(values(name, "select count(*) from pg_policies where policyname in ('existing_member_read','legacy_objects_access','legacy_buckets_access');"), '3');
  assert.equal(values(name, 'select count(*) from storage.objects;'), '1');
  assert.equal(values(name, 'select id from storage.buckets;'), 'existing-bucket');
  assert.equal(values(name, `select count(*) from pg_trigger where tgname in ('protect_buckets_delete','protect_objects_delete')
    and tgrelid in ('storage.buckets'::regclass,'storage.objects'::regclass);`), '2');
});

test('Storage protection rejects direct SQL deletion even for an empty bucket', options, t => {
  const name = database(t);
  reject(name, "delete from storage.buckets where id='product-images';", /Direct deletion from storage tables is not allowed/);
  assert.equal(values(name, "select count(*) from storage.buckets where id='product-images';"), '1');
});

test('rollback refuses unowned tables and rolls back atomically on unexpected dependencies', options, async t => {
  for (const [setup, pattern] of [
    ["comment on table public.categories is 'someone else';", /CATALOG_ROLLBACK_OBJECT_REVIEW_REQUIRED/],
    ['create view public.catalog_dependent as select id from public.categories;', /2BP01/],
  ]) {
    await t.test(String(pattern), () => {
      const name = database(t);
      sql(name, setup);
      const result = sql(name, rollback(), false);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, pattern);
      assert.equal(values(name, "select to_regclass('public.products') is not null;"), 't');
      assert.equal(values(name, "select count(*) from storage.buckets where id in ('product-images','category-images');"), '2');
    });
  }
});
