import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { database } from './helpers/cart-db.mjs';
import { A, B } from './helpers/cart-fixtures.mjs';

const options = { skip: !process.env.CART_TEST_CONTAINER && 'Set CART_TEST_CONTAINER to an isolated bang-cart-test-* container; never a remote database.' };
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const migration = () => read('../supabase/migrations/20261031000000_user_addresses.sql');
const rollback = () => read('../supabase/rollback/20261031000000_user_addresses.sql');
const preflight = () => read('../supabase/checks/user-addresses-preflight.sql');
const seed = () => read('../supabase/seeds/20261031000000_user_addresses.sql');

const MISSING = '00000000-0000-4000-8000-000000000003';
const insertAddress = (userId, name, isDefault = false) => `insert into public.user_addresses
  (user_id,recipient_name,phone_number,postal_code,address_line_1,is_default)
  values ('${userId}','${name}','010-1234-5678','06134','서울특별시 강남구 테헤란로 123',${isDefault});`;

function addresses(t) {
  const db = database(t, { migrate: false });
  db.sql('alter table public.users add column email text;');
  db.sql(migration());
  return db;
}

function defaults(db, userId) {
  return db.sql(`select coalesce(string_agg(recipient_name,',' order by recipient_name),'')
    from public.user_addresses where user_id='${userId}' and is_default;`);
}

test('user_addresses starts empty with RLS, defaults, indexes and migration markers', options, t => {
  const db = addresses(t);
  assert.equal(db.sql(`select relrowsecurity from pg_class where oid='public.user_addresses'::regclass;`), 't');
  assert.equal(db.sql('select count(*) from public.user_addresses;'), '0');
  db.sql(insertAddress(A, '첫 배송지'));
  assert.equal(db.sql(`select id is not null and label is null and is_default and created_at is not null
    and updated_at is not null from public.user_addresses;`), 't');
  assert.equal(db.sql(`select count(*) from pg_indexes where schemaname='public' and tablename='user_addresses'
    and indexname in ('user_addresses_one_default_idx','user_addresses_user_order_idx');`), '2');
  assert.equal(db.sql(`select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and obj_description(p.oid,'pg_proc')='bang_user_addresses_20261031000000';`), '2');
});

test('user_addresses constraints reject blank, oversized, malformed and orphan rows', options, t => {
  const db = addresses(t);
  db.sql(insertAddress(A, '기본'));
  for (const statement of [
    "update public.user_addresses set recipient_name='  ';",
    `update public.user_addresses set recipient_name='${'가'.repeat(51)}';`,
    "update public.user_addresses set phone_number=' ';",
    "update public.user_addresses set postal_code='1234';",
    "update public.user_addresses set postal_code='12a45';",
    "update public.user_addresses set address_line_1='';",
    "update public.user_addresses set address_line_2='';",
    `update public.user_addresses set delivery_note='${'가'.repeat(201)}';`,
    "update public.user_addresses set label=' ';",
    `update public.user_addresses set label='${'가'.repeat(31)}';`,
  ]) db.reject(statement, /23514/);
  db.reject('update public.user_addresses set recipient_name=null;', /23502/);
  db.reject(insertAddress(MISSING, '고아'), /23503/);
});

test('first address becomes default and a new default replaces the old one', options, t => {
  const db = addresses(t);
  db.sql(insertAddress(A, '가'));
  db.sql(insertAddress(A, '나'));
  assert.equal(defaults(db, A), '가');
  db.sql(insertAddress(A, '다', true));
  assert.equal(defaults(db, A), '다');
  db.sql("update public.user_addresses set is_default=true where recipient_name='나';");
  assert.equal(defaults(db, A), '나');
  db.sql(insertAddress(B, '비'));
  assert.equal(defaults(db, B), '비');
  assert.equal(defaults(db, A), '나');
});

test('edits without the default flag keep a default switched in between', options, t => {
  const db = addresses(t);
  db.sql(insertAddress(A, '가'));
  db.sql(insertAddress(A, '나'));
  db.sql("update public.user_addresses set is_default=true where recipient_name='나';");
  db.sql("update public.user_addresses set delivery_note='문 앞' where recipient_name='가';");
  assert.equal(defaults(db, A), '나');
  db.sql("update public.user_addresses set delivery_note='경비실' where recipient_name='나';");
  assert.equal(defaults(db, A), '나');
});

test('default address cannot be cleared or deleted until another becomes default', options, t => {
  const db = addresses(t);
  db.sql(insertAddress(A, '가'));
  db.sql(insertAddress(A, '나'));
  db.reject("update public.user_addresses set is_default=false where recipient_name='가';", /23514.*USER_ADDRESS_DEFAULT_REQUIRED/s);
  db.reject("delete from public.user_addresses where recipient_name='가';", /23514.*USER_ADDRESS_DEFAULT_DELETE/s);
  db.sql("delete from public.user_addresses where recipient_name='나';");
  db.sql(insertAddress(A, '다'));
  db.sql("update public.user_addresses set is_default=true where recipient_name='다';");
  db.sql("delete from public.user_addresses where recipient_name='가';");
  assert.equal(db.sql('select string_agg(recipient_name,\',\') from public.user_addresses;'), '다');
  assert.equal(defaults(db, A), '다');
});

test('members read and write only their own addresses while active, verified and not deleted', options, t => {
  const db = addresses(t);
  db.sql(insertAddress(A, '에이') + insertAddress(B, '비'));
  assert.equal(db.as(A, 'select string_agg(recipient_name,\',\') from public.user_addresses;'), '에이');
  assert.equal(db.as(B, 'select string_agg(recipient_name,\',\') from public.user_addresses;'), '비');
  assert.equal(db.as(MISSING, 'select count(*) from public.user_addresses;'), '0');

  db.as(A, insertAddress(A, '에이2'));
  db.as(A, "update public.user_addresses set delivery_note='메모' where recipient_name='에이2';");
  db.as(A, "update public.user_addresses set is_default=true where recipient_name='에이2';");
  db.as(A, "delete from public.user_addresses where recipient_name='에이';");
  assert.equal(db.sql(`select string_agg(recipient_name||':'||is_default||':'||coalesce(delivery_note,''),',')
    from public.user_addresses where user_id='${A}';`), '에이2:true:메모');

  assert.throws(() => db.as(A, insertAddress(B, '대신')), /42501/);
  assert.equal(db.as(A, "update public.user_addresses set delivery_note='침범' where recipient_name='비' returning id;"), '');
  assert.equal(db.as(A, "delete from public.user_addresses where recipient_name='비' returning id;"), '');
  db.sql(insertAddress(B, '비2'));
  assert.equal(db.as(A, "update public.user_addresses set is_default=true where recipient_name='비2' returning id;"), '');
  assert.equal(defaults(db, B), '비');

  for (const change of ["status='suspended'", "status='deleted'", 'deleted_at=now()', 'email_verified_at=null']) {
    db.sql(`update public.users set ${change} where id='${A}';`);
    assert.equal(db.as(A, 'select count(*) from public.user_addresses;'), '0');
    assert.throws(() => db.as(A, insertAddress(A, '정지')), /42501/);
    assert.equal(db.as(A, "update public.user_addresses set delivery_note='정지' returning id;"), '');
    db.sql(`update public.users set status='active',deleted_at=null,email_verified_at='2026-10-22' where id='${A}';`);
  }
  assert.throws(() => db.as(null, 'select count(*) from public.user_addresses;', 'anon'), /42501/);
  assert.throws(() => db.as(null, insertAddress(A, '익명'), 'anon'), /42501/);
});

test('column grants block identity, owner and timestamp changes by members', options, t => {
  const db = addresses(t);
  db.sql(insertAddress(A, '에이'));
  for (const statement of [
    `update public.user_addresses set user_id='${B}';`,
    "update public.user_addresses set id=gen_random_uuid();",
    "update public.user_addresses set created_at='2000-01-01';",
    "update public.user_addresses set updated_at='2000-01-01';",
    `insert into public.user_addresses(id,user_id,recipient_name,phone_number,postal_code,address_line_1)
      values (gen_random_uuid(),'${A}','아이디','010','06134','주소');`,
    `insert into public.user_addresses(user_id,recipient_name,phone_number,postal_code,address_line_1,created_at)
      values ('${A}','시각','010','06134','주소','2000-01-01');`,
    'truncate public.user_addresses;',
  ]) assert.throws(() => db.as(A, statement), /42501/);
  assert.equal(db.sql(`select has_function_privilege('authenticated','private.user_address_before_write()','execute')
    or has_function_privilege('anon','private.user_address_before_delete()','execute');`), 'f');
});

test('updates refresh updated_at, keep created_at, and member deletion stays restricted', options, t => {
  const db = addresses(t);
  db.sql(insertAddress(A, '에이'));
  db.sql("update public.user_addresses set created_at='2000-01-01',updated_at='2000-01-01';");
  db.sql("update public.user_addresses set delivery_note='메모';");
  assert.equal(db.sql(`select created_at='2000-01-01'::timestamptz and updated_at>'2000-01-01'::timestamptz
    from public.user_addresses;`), 't');
  db.reject(`delete from public.users where id='${A}';`, /23503/);
});

test('concurrent first inserts and default switches leave exactly one default', options, async t => {
  const db = addresses(t);
  const asA = sql => `set role authenticated; set request.jwt.claim.sub='${A}';\n${sql}`;
  await db.parallel([1, 2, 3, 4].map(index => asA(insertAddress(A, `동시${index}`))));
  assert.equal(db.sql(`select count(*) filter (where is_default)||'/'||count(*) from public.user_addresses;`), '1/4');
  await db.parallel([1, 2, 3, 4].map(index =>
    asA(`update public.user_addresses set is_default=true where recipient_name='동시${index}';`)));
  assert.equal(db.sql(`select count(*) filter (where is_default)||'/'||count(*) from public.user_addresses;`), '1/4');
  const current = db.sql('select recipient_name from public.user_addresses where is_default;');
  const other = db.sql(`select recipient_name from public.user_addresses where not is_default order by 1 limit 1;`);
  await db.parallel([
    asA(`begin; update public.user_addresses set delivery_note='편집' where recipient_name='${current}';
      select pg_sleep(0.3); commit;`),
    asA(`select pg_sleep(0.1); update public.user_addresses set is_default=true where recipient_name='${other}';`),
  ]);
  assert.equal(db.sql(`select string_agg(recipient_name||':'||is_default||':'||coalesce(delivery_note,''),',' order by is_default desc)
    from public.user_addresses where recipient_name in ('${current}','${other}');`),
    `${other}:true:,${current}:false:편집`);
});

test('rollback removes only an empty marked table and preflight stays read-only', options, t => {
  const db = addresses(t);
  db.sql(insertAddress(A, '에이'));
  db.reject(rollback(), /USER_ADDRESS_ROLLBACK_NOT_EMPTY/);
  db.sql(`alter table public.user_addresses disable trigger user_addresses_before_delete;
    delete from public.user_addresses;
    alter table public.user_addresses enable trigger user_addresses_before_delete;`);
  assert.match(db.sql(preflight()), /true|on/);
  db.sql(rollback());
  assert.equal(db.sql("select to_regclass('public.user_addresses') is null;"), 't');
  assert.equal(db.sql(`select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and p.proname like 'user_address_%';`), '0');
  db.sql(migration());
  assert.equal(db.sql('select count(*) from public.user_addresses;'), '0');
});

test('seed copies the five fixture addresses to the demo member once', options, t => {
  const db = addresses(t);
  db.reject(seed(), /USER_ADDRESS_SEED_MEMBER_REQUIRED/);
  db.sql(`update public.users set email='demo@example.com' where id='${A}';`);
  db.sql(seed());
  assert.equal(db.sql(`select count(*)||'/'||count(*) filter (where is_default)||'/'||count(label)
    from public.user_addresses where user_id='${A}';`), '5/1/3');
  assert.equal(db.sql(`select label from public.user_addresses where is_default;`), '집');
  assert.equal(db.sql(`select string_agg(postal_code,',' order by created_at desc,id) from public.user_addresses;`),
    '48094,04782,05554,13494,06134');
  db.reject(seed(), /USER_ADDRESS_SEED_TARGET_NOT_EMPTY/);
  assert.equal(db.sql('select count(*) from public.user_addresses;'), '5');
});
