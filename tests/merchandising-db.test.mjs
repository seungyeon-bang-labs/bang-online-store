import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { loadTs } from './helpers/load-ts.mjs';

const container = process.env.CATALOG_TEST_CONTAINER;
if (container) assert.match(container, /^bang-catalog-test-[a-z0-9-]+$/, 'Only isolated catalog test containers are allowed');
const options = { skip: !container && 'Set CATALOG_TEST_CONTAINER to an isolated bang-catalog-test-* container; never a remote database.' };
const baseline = process.env.MERCHANDISING_TEST_SKIP_MIGRATION === '1';
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const migration = () => read('../supabase/migrations/20261019000000_product_merchandising.sql');
const rollback = () => read('../supabase/rollback/20261019000000_product_merchandising.sql');
const seedScript = () => read('../supabase/seeds/20261019000000_product_merchandising.sql');
const tables = ['product_stats', 'discounts', 'discount_items', 'product_sections', 'product_section_items'];
const updateColumns = {product_stats:'total_sales',discounts:'priority',discount_items:'discount_rate',product_sections:'display_order',product_section_items:'display_order'};
let sequence = 0;

function docker(args, input) {
  return spawnSync('docker', args, { input, encoding: 'utf8', timeout: 30000 });
}
function sql(name, input, success = true) {
  const result = docker(['exec', '-i', container, 'psql', '-X', '-A', '-t', '-U', 'postgres', '-d', name,
    '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-q'], input);
  if (success) assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result;
}
function value(name, statement) { return sql(name, statement).stdout.trim(); }
function reject(name, statement, pattern) {
  const result = sql(name, `begin;\n${statement}\nrollback;`, false);
  assert.notEqual(result.status, 0, statement);
  assert.match(result.stderr, pattern);
}
function database(t, { migrate = true } = {}) {
  const name = `merch_tests_${Date.now()}_${++sequence}`;
  const result = docker(['exec', container, 'createdb', '-U', 'postgres', name]);
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  t.after(() => {
    const removed = docker(['exec', container, 'dropdb', '-U', 'postgres', name]);
    assert.equal(removed.status, 0, removed.stderr);
  });
  sql(name, read('./db/catalog-fixture.sql') + read('../supabase/migrations/20261017000000_product_catalog.sql'));
  if (migrate && !baseline) sql(name, migration());
  return name;
}
function as(role, statement) { return `set role ${role}; ${statement} reset role;`; }
const products = `
insert into public.categories(id,name,slug) values ('test','테스트','test');
insert into public.product_styles(id,category_id,name) values (1,'test','상품');
insert into public.colors(id,code,label,hex_code)
select id,'C'||id,'색상'||id,'#000000' from generate_series(1,28) id;
insert into public.products(id,style_id,color_id,price,state)
select id,1,id,10001,case when id=2 then 'inactive' else 'active' end from generate_series(1,28) id;
insert into public.product_variants(id,product_id,sku,size,stock)
select id,id,'TEST-'||id,'M',case when id=3 then 0 else 1 end from generate_series(1,28) id;
`;
const rows = `
insert into public.product_stats(product_id,total_sales,today_sales,weekly_sales,monthly_sales)
values (1,30,1,5,10),(2,40,2,6,11),(3,50,3,7,12);
insert into public.discounts(id,title,starts_at,ends_at,priority,is_active) values
 (1,'진행',now()-interval '1 day',now()+interval '1 day',1,true),
 (2,'예정',now()+interval '1 day',now()+interval '2 days',2,true),
 (3,'종료',now()-interval '2 days',now()-interval '1 day',3,true),
 (4,'비활성',now()-interval '1 day',now()+interval '1 day',4,false);
insert into public.discount_items(discount_id,product_id,discount_rate) values
 (1,1,15),(1,2,20),(1,3,100),(2,1,25),(3,1,30),(4,1,40);
insert into public.product_sections(id,title,display_order,desktop_rows,is_active) values
 (1,'표시',0,2,true),(2,'숨김',1,1,false);
insert into public.product_section_items(section_id,product_id,display_order) values
 (1,1,0),(1,2,1),(1,3,2),(2,1,0);
`;

test('merchandising schema preserves existing catalog and member objects', options, t => {
  const name = database(t);
  sql(name, products + rows);
  assert.equal(value(name, `select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('product_stats','discounts','discount_items','product_sections','product_section_items') and c.relrowsecurity;`), '5');
  assert.equal(value(name, 'select count(*) from public.products;'), '28');
  assert.equal(value(name, 'select name from public.users;'), '기존 회원');
  assert.equal(value(name, `select count(*) from pg_trigger where tgname='existing_member_hook';`), '1');
});

test('merchandising constraints reject invalid data and protect parents', options, t => {
  const name = database(t);
  sql(name, products + rows);
  const cases = [
    ['update public.product_stats set total_sales=-1;', /23514/],
    ['update public.product_stats set today_sales=-1;', /23514/],
    ['update public.product_stats set weekly_sales=-1;', /23514/],
    ['update public.product_stats set monthly_sales=-1;', /23514/],
    ['update public.product_stats set total_sales=null;', /23502/],
    ['insert into public.product_stats(product_id) values (1);', /23505/],
    ['insert into public.product_stats(product_id) values (999);', /23503/],
    ['update public.discounts set starts_at=ends_at;', /23514/],
    ['update public.discounts set starts_at=ends_at+interval \'1 second\';', /23514/],
    ['update public.discounts set id=0 where id=1;', /23514/],
    ['update public.discount_items set discount_rate=0;', /23514/],
    ['update public.discount_items set discount_rate=101;', /23514/],
    ['update public.discount_items set discount_rate=null;', /23502/],
    ['insert into public.discount_items values (1,1,10);', /23505/],
    ['insert into public.discount_items values (999,1,10);', /23503/],
    ['insert into public.discount_items values (1,999,10);', /23503/],
    ['update public.product_sections set desktop_rows=0;', /23514/],
    ['update public.product_sections set display_order=-1;', /23514/],
    ['update public.product_sections set desktop_rows=null;', /23502/],
    ['update public.product_section_items set display_order=-1;', /23514/],
    ['insert into public.product_section_items values (1,1,9);', /23505/],
    ['insert into public.product_section_items values (1,4,0);', /23505/],
    ['insert into public.product_section_items values (999,4,0);', /23503/],
    ['insert into public.product_section_items values (1,999,9);', /23503/],
    ['delete from public.products where id=1;', /23503/],
    ['delete from public.discounts where id=1;', /23503/],
    ['delete from public.product_sections where id=1;', /23503/],
  ];
  for (const [statement, pattern] of cases) reject(name, statement, pattern);
});

test('public reads expose active periods and parents while retaining sold-out products', options, t => {
  const name = database(t);
  sql(name, products + rows);
  for (const role of ['anon','authenticated']) {
    assert.equal(value(name, as(role, 'select string_agg(product_id::text,\',\' order by product_id) from public.product_stats;')), '1,3');
    assert.equal(value(name, as(role, 'select string_agg(id::text,\',\' order by id) from public.discounts;')), '1');
    assert.equal(value(name, as(role, 'select string_agg(product_id::text,\',\' order by product_id) from public.discount_items;')), '1,3');
    assert.equal(value(name, as(role, 'select string_agg(id::text,\',\' order by id) from public.product_sections;')), '1');
    assert.equal(value(name, as(role, 'select string_agg(product_id::text,\',\' order by product_id) from public.product_section_items;')), '1,3');
    assert.equal(value(name, as(role, 'select total_sales from public.product_stats where product_id=3;')), '50');
  }
});

test('ordinary writes are blocked by privileges and RLS even after an accidental DML grant', options, t => {
  const name = database(t);
  sql(name, products + rows);
  for (const role of ['anon','authenticated']) for (const table of tables) {
    reject(name, as(role, `delete from public.${table};`), /42501/);
    reject(name, as(role, `update public.${table} set ${updateColumns[table]}=${updateColumns[table]};`), /42501/);
  }
  sql(name, `grant insert,update,delete on ${tables.map(table=>'public.'+table).join(',')} to anon,authenticated;`);
  for (const role of ['anon','authenticated']) {
    reject(name, as(role, 'insert into public.product_stats(product_id) values (28);'), /42501/);
    reject(name, as(role, `insert into public.discounts(id,title,starts_at,ends_at) values (99,'x',now(),now()+interval '1 day');`), /42501/);
    reject(name, as(role, 'insert into public.discount_items values (1,28,10);'), /42501/);
    reject(name, as(role, `insert into public.product_sections(id,title,desktop_rows) values (99,'x',1);`), /42501/);
    reject(name, as(role, 'insert into public.product_section_items values (1,28,9);'), /42501/);
    for (const table of tables) {
      assert.equal(value(name, as(role, `with deleted as (delete from public.${table} returning *) select count(*) from deleted;`)), '0');
      assert.equal(value(name, as(role, `with changed as (update public.${table} set ${updateColumns[table]}=${updateColumns[table]} returning *) select count(*) from changed;`)), '0');
    }
  }
});

test('updated_at triggers affect only new mutable tables', options, t => {
  const name = database(t);
  sql(name, products + rows);
  for (const [table,key] of [['product_stats','product_id'],['discounts','id'],['product_sections','id']]) {
    sql(name, `update public.${table} set updated_at='2000-01-01' where ${key}=1;`);
    assert.equal(value(name, `select updated_at>'2000-01-01' from public.${table} where ${key}=1;`), 't');
  }
  assert.equal(value(name, `select has_function_privilege('anon','private.set_merchandising_updated_at()','execute');`), 'f');
});

test('schema conflicts abort without replacing existing objects', options, t => {
  const name = database(t, {migrate:false});
  sql(name, 'create table public.product_stats(sentinel text);');
  const result = sql(name, migration(), false);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MERCHANDISING_MIGRATION_OBJECT_EXISTS/);
  assert.equal(value(name, `select column_name from information_schema.columns where table_name='product_stats';`), 'sentinel');
  assert.equal(value(name, `select to_regclass('public.discounts') is null;`), 't');
});

test('rollback removes only empty owned objects and refuses registered data', options, t => {
  const name = database(t);
  sql(name, products + rows);
  const denied = sql(name, rollback(), false);
  assert.notEqual(denied.status, 0);
  assert.match(denied.stderr, /MERCHANDISING_ROLLBACK_NOT_EMPTY/);
  assert.equal(value(name, 'select count(*) from public.discount_items;'), '6');
  const empty = database(t);
  sql(empty, rollback());
  for (const table of tables) assert.equal(value(empty, `select to_regclass('public.${table}') is null;`), 't');
  assert.equal(value(empty, 'select count(*) from public.users;'), '1');
  assert.equal(value(empty, `select to_regclass('public.products') is not null;`), 't');
});

test('public campaign boundaries include start and exclude end at the DB transaction clock', options, t => {
  const name = database(t);
  sql(name, products + rows);
  for (const role of ['anon','authenticated']) {
    assert.equal(value(name, `begin; update public.discounts set starts_at=now() where id=1;
      ${as(role,'select count(*) from public.discounts where id=1;')} rollback;`), '1');
    assert.equal(value(name, `begin; update public.discounts set ends_at=now() where id=1;
      ${as(role,'select count(*) from public.discounts where id=1;')} rollback;`), '0');
  }
});

test('preflight stays read-only before and after migration and tolerates CLI history differences', options, t => {
  const name = database(t,{migrate:false});
  const before = value(name,'select count(*) from public.users;');
  sql(name,read('../supabase/checks/merchandising-preflight.sql'));
  assert.equal(value(name,`select to_regclass('public.product_stats') is null;`),'t');
  sql(name,migration());
  sql(name,`create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text,name text);
    insert into supabase_migrations.schema_migrations values ('20261017000000','existing_catalog');`);
  const result = sql(name,read('../supabase/checks/merchandising-preflight.sql'));
  assert.match(result.stderr,/existing_catalog/);
  assert.equal(value(name,'select count(*) from public.users;'),before);
  assert.equal(counts(name),'0|0|0|0|0');
});

function seedWith(change) {
  const source = seedScript();
  const match = source.match(/\$merch_seed\$([\s\S]*?)\$merch_seed\$/);
  assert.ok(match, 'The one-time seed must expose its fixed JSON input for validation tests');
  const payload = JSON.parse(match[1]);
  change(payload);
  return source.replace(match[0], '$merch_seed$'+JSON.stringify(payload)+'$merch_seed$');
}
function counts(name) {
  return value(name, 'select '+tables.map(table=>`(select count(*) from public.${table})`).join(','));
}

test('initial seed registers 72 rows and preserves demo stats and discounts with additional catalog products', options, t => {
  const name = database(t);
  sql(name, products);
  sql(name, seedScript());
  assert.equal(counts(name), '27|3|15|2|25');
  assert.equal(value(name, 'select count(*) from public.products;'), '28');
  const catalog = loadTs('src/domains/product/fixture.ts');
  const stats = JSON.parse(value(name, `select json_agg(x order by product_id) from (
    select product_id,total_sales,today_sales,weekly_sales,monthly_sales from public.product_stats) x;`));
  assert.deepEqual(stats, catalog.PRODUCT_STATS_FIXTURE);
  const fixtureDiscounts = loadTs('src/domains/discount/discount.fixture.ts').DISCOUNTS;
  const actualDiscounts = JSON.parse(value(name, `select json_agg(x order by id) from (
    select id,title,priority,is_active from public.discounts) x;`));
  assert.deepEqual(actualDiscounts, fixtureDiscounts.map(d=>({id:d.id,title:d.title,priority:d.priority,is_active:d.isActive})));
  const actualItems = JSON.parse(value(name, `select json_agg(x order by discount_id,product_id) from (
    select discount_id,product_id,discount_rate from public.discount_items) x;`));
  assert.deepEqual(actualItems, fixtureDiscounts.flatMap(d=>d.items.flatMap(item=>item.productIds.map(id=>({discount_id:d.id,product_id:id,discount_rate:item.discountRate})))));
  assert.equal(value(name, `select bool_and(ends_at=starts_at+interval '1 year') from public.discounts;`), 't');
  assert.equal(value(name, `select count(distinct (starts_at,ends_at)) from public.discounts;`), '1');
  const before = value(name, `select json_agg(d order by id) from public.discounts d;`);
  const again = sql(name, seedScript(), false);
  assert.notEqual(again.status,0);
  assert.match(again.stderr,/MERCHANDISING_SEED_TARGET_EXISTS/);
  assert.equal(value(name, `select json_agg(d order by id) from public.discounts d;`),before);
});

test('a single existing seed target aborts before writing or overwriting anything', options, t => {
  const name = database(t);
  sql(name, products+'insert into public.product_stats(product_id,total_sales) values (1,999);');
  const result = sql(name, seedScript(), false);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/MERCHANDISING_SEED_TARGET_EXISTS/);
  assert.equal(counts(name),'1|0|0|0|0');
  assert.equal(value(name,'select total_sales from public.product_stats where product_id=1;'),'999');
});

test('raw fractional rates are rejected before PostgreSQL integer casting and nothing is registered', options, t => {
  const name = database(t);
  sql(name, products);
  for (const change of [
    p=>{p.discount_items[0].discount_rate=15.5;},
    p=>{p.product_stats[0].total_sales=-1;},
    p=>{p.product_section_items[0].product_id=999;},
    p=>{p.product_section_items[1].display_order=p.product_section_items[0].display_order;},
    p=>{p.discount_items[0].discount_rate=101;},
    p=>{p.product_sections[0].desktop_rows=0;},
  ]) {
    const result = sql(name,seedWith(change),false);
    assert.notEqual(result.status,0);
    assert.equal(counts(name),'0|0|0|0|0');
  }
});

test('active overlaps across existing and seed data are refused, including future and past periods', options, t => {
  const name = database(t);
  sql(name,products);
  const source = seedScript().match(/\$merch_seed\$([\s\S]*?)\$merch_seed\$/);
  const input = JSON.parse(source[1]);
  const {starts_at:start,ends_at:end} = input.discounts[0];
  for (const [from,to] of [[start,end],['2020-01-01T00:00:00Z','2021-01-01T00:00:00Z'],['2040-01-01T00:00:00Z','2041-01-01T00:00:00Z']]) {
    const shifted = seedWith(p=>{for(const d of p.discounts){d.starts_at=from;d.ends_at=to;}});
    sql(name,`insert into public.discounts(id,title,starts_at,ends_at) values (99,'기존','${from}','${to}');
      insert into public.discount_items values (99,1,10);`);
    const result=sql(name,shifted,false);
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/MERCHANDISING_SEED_PERIOD_OVERLAP/);
    assert.equal(counts(name),'0|1|1|0|0');
    sql(name,'delete from public.discount_items where discount_id=99; delete from public.discounts where id=99;');
  }
  const incomingOverlap = sql(name,seedWith(p=>{p.discount_items[5].product_id=1;}),false);
  assert.notEqual(incomingOverlap.status,0);
  assert.match(incomingOverlap.stderr,/MERCHANDISING_SEED_PERIOD_OVERLAP/);
  assert.equal(counts(name),'0|0|0|0|0');
});

test('inactive overlaps and adjacent exclusive periods do not prevent registration', options, t => {
  const source = JSON.parse(seedScript().match(/\$merch_seed\$([\s\S]*?)\$merch_seed\$/)[1]);
  const {starts_at:start,ends_at:end} = source.discounts[0];
  for (const existing of [
    `'${start}'::timestamptz,'${end}'::timestamptz,false`,
    `'${start}'::timestamptz-interval '1 day','${start}'::timestamptz,true`,
    `'${end}'::timestamptz,'${end}'::timestamptz+interval '1 day',true`,
  ]) {
    const name=database(t);
    sql(name,products+`insert into public.discounts(id,title,starts_at,ends_at,is_active) values (99,'기존',${existing}); insert into public.discount_items values (99,1,10);`);
    sql(name,seedScript());
    assert.equal(counts(name),'27|4|16|2|25');
  }
});

test('failure in the last seed insert rolls back all tables and retry keeps the frozen period', options, t => {
  const name=database(t);
  sql(name,products+`create function public.fail_last_seed_item() returns trigger language plpgsql as $$
    begin if new.product_id=25 then raise exception 'TEST_LAST_INSERT_FAILED'; end if; return new; end $$;
    create trigger fail_last_seed before insert on public.product_section_items for each row execute function public.fail_last_seed_item();`);
  const result=sql(name,seedScript(),false);
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/TEST_LAST_INSERT_FAILED/);
  assert.equal(counts(name),'0|0|0|0|0');
  sql(name,'drop trigger fail_last_seed on public.product_section_items; drop function public.fail_last_seed_item();');
  sql(name,seedScript());
  assert.equal(counts(name),'27|3|15|2|25');
  const source=JSON.parse(seedScript().match(/\$merch_seed\$([\s\S]*?)\$merch_seed\$/)[1]);
  const actual=JSON.parse(value(name,'select json_agg(d order by id) from (select id,starts_at,ends_at from public.discounts) d;'));
  assert.deepEqual(actual.map(d=>[Date.parse(d.starts_at),Date.parse(d.ends_at)]),source.discounts.map(d=>[Date.parse(d.starts_at),Date.parse(d.ends_at)]));
});
