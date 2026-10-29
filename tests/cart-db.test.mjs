import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { database } from './helpers/cart-db.mjs';
import { A, B, I1, I2, CART_A, CART_B, REQUEST1 } from './helpers/cart-fixtures.mjs';
import { loadTs } from './helpers/load-ts.mjs';

const options = { skip: !process.env.CART_TEST_CONTAINER && 'Set CART_TEST_CONTAINER to an isolated bang-cart-test-* container; never a remote database.' };
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const migration = () => read('../supabase/migrations/20261023000000_cart.sql');
const rollback = () => read('../supabase/rollback/20261023000000_cart.sql');
const preflight = () => read('../supabase/checks/cart-preflight.sql');

function seedCarts(db, { receipts = true } = {}) {
  db.sql(`
    insert into public.carts(id,user_id) values ('${CART_A}','${A}'),('${CART_B}','${B}');
    insert into public.cart_items(id,cart_id,product_variant_id,quantity) values
      ('${I1}','${CART_A}',2,2),('${I2}','${CART_B}',7,3);
  `);
  if (receipts) db.sql(`
    insert into public.cart_operations(cart_id,request_id,operation_type,request_payload,result) values
      ('${CART_A}','${REQUEST1}','add_items','{"version":1,"operation":{"kind":"add_items","items":[{"productId":1,"variantId":2,"quantity":2}]}}','{"outcome":"applied"}'),
      ('${CART_B}','${REQUEST1}','add_items','{"version":1,"operation":{"kind":"add_items","items":[{"productId":2,"variantId":7,"quantity":3}]}}','{"outcome":"applied"}');
  `);
}

function counts(db, userId, role) {
  return db.as(userId, `select
    (select count(*) from public.carts),
    (select count(*) from public.cart_items),
    (select count(*) from public.cart_operations);`, role);
}

test('cart schema starts empty with UUID, bigint and timestamp defaults and RLS', options, t => {
  const db = database(t);
  assert.equal(db.sql(`select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in ('carts','cart_items','cart_operations') and c.relrowsecurity;`), '3');
  assert.equal(db.sql('select (select count(*) from public.carts)+(select count(*) from public.cart_items)+(select count(*) from public.cart_operations);'), '0');
  db.sql(`insert into public.carts(user_id) values ('${A}');`);
  assert.equal(db.sql('select revision=0 and id is not null and created_at is not null and updated_at is not null from public.carts;'), 't');
  assert.equal(db.sql(`select data_type from information_schema.columns
    where table_schema='public' and table_name='cart_items' and column_name='product_variant_id';`), 'bigint');
  assert.equal(db.sql(`select count(*) from information_schema.columns where table_schema='public'
    and table_name in ('carts','cart_items','cart_operations') and data_type='timestamp with time zone';`), '5');
  assert.equal(db.sql(`select count(*) from information_schema.columns where table_schema='public'
    and table_name in ('carts','cart_items','cart_operations') and column_name in ('price','stock','product_name','discount_rate');`), '0');
});

test('cart constraints reject invalid quantities, duplicates, nulls and missing relations', options, t => {
  const db = database(t);
  seedCarts(db);
  for (const [statement, pattern] of [
    [`insert into public.carts(user_id) values ('${A}');`, /23505/],
    [`insert into public.carts(user_id) values ('00000000-0000-4000-8000-000000000099');`, /23503/],
    ['update public.carts set revision=-1;', /23514/],
    ['update public.carts set revision=null;', /23502/],
    ['update public.cart_items set quantity=0;', /23514/],
    ['update public.cart_items set quantity=-1;', /23514/],
    ['update public.cart_items set quantity=2147483648;', /22003/],
    ['update public.cart_items set quantity=null;', /23502/],
    [`insert into public.cart_items(cart_id,product_variant_id,quantity) values ('${CART_A}',2,1);`, /23505/],
    [`insert into public.cart_items(cart_id,product_variant_id,quantity) values ('${CART_A}',999,1);`, /23503/],
    [`insert into public.cart_items(cart_id,product_variant_id,quantity) values ('${REQUEST1}',17,1);`, /23503/],
    [`insert into public.cart_operations select * from public.cart_operations where cart_id='${CART_A}';`, /23505/],
    ["update public.cart_operations set request_payload='[]';", /23514/],
    ["update public.cart_operations set result='null';", /23514/],
    ["update public.cart_operations set operation_type='replace_all';", /23514/],
  ]) db.reject(statement, pattern);
});

test('owner-only cart reads include active confirmed membership and parent ownership', options, t => {
  const db = database(t);
  seedCarts(db);
  assert.equal(counts(db, A), '1|1|1');
  assert.equal(counts(db, B), '1|1|1');
  assert.equal(db.as(A, 'select quantity from public.cart_items;'), '2');
  assert.equal(db.as(B, 'select quantity from public.cart_items;'), '3');
  assert.equal(counts(db, null), '0|0|0');
  assert.equal(counts(db, '00000000-0000-4000-8000-000000000003'), '0|0|0');
  for (const change of ["status='suspended'", "status='deleted'", 'deleted_at=now()', 'email_verified_at=null']) {
    db.sql(`update public.users set ${change} where id='${A}';`);
    assert.equal(counts(db, A), '0|0|0');
    db.sql(`update public.users set status='active',deleted_at=null,email_verified_at='2026-10-22' where id='${A}';`);
  }
  assert.throws(() => counts(db, null, 'anon'), /42501/);
  db.sql('grant select on public.carts,public.cart_items,public.cart_operations to anon;');
  assert.equal(counts(db, A, 'anon'), '0|0|0');
});

test('direct member writes, truncate and private function execution are not granted', options, t => {
  const db = database(t);
  seedCarts(db);
  for (const statement of [
    'update public.cart_items set quantity=8;',
    'delete from public.cart_items;',
    `insert into public.carts(user_id) values ('${A}');`,
    'truncate public.cart_items;',
    "update public.cart_operations set result='{}';",
  ]) assert.throws(() => db.as(A, statement), /42501/);
  assert.equal(db.sql(`select has_function_privilege('authenticated','private.set_cart_updated_at()','execute')
    or has_function_privilege('anon','private.set_cart_updated_at()','execute');`), 'f');
  assert.equal(counts(db, A), '1|1|1');
});

test('missing write policies still block DML after accidental table grants', options, t => {
  const db = database(t);
  seedCarts(db);
  db.sql('grant insert,update,delete on public.carts,public.cart_items,public.cart_operations to authenticated;');
  assert.equal(db.as(A, 'update public.cart_items set quantity=8 returning id;'), '');
  assert.equal(db.as(A, `update public.carts set user_id='${B}' returning id;`), '');
  assert.equal(db.as(A, "update public.cart_operations set result='{}' returning request_id;"), '');
  assert.equal(db.as(A, 'delete from public.cart_items returning id;'), '');
  assert.throws(() => db.as(A, `insert into public.cart_items(cart_id,product_variant_id,quantity) values ('${CART_A}',17,1);`), /42501/);
  assert.equal(db.as(A, 'select quantity from public.cart_items;'), '2');
  assert.equal(counts(db, B), '1|1|1');
});

test('only cart items cascade while member, variant and receipt references restrict deletion', options, t => {
  const db = database(t);
  seedCarts(db, { receipts: false });
  db.sql(`delete from public.carts where id='${CART_A}';`);
  assert.equal(db.sql('select count(*) from public.cart_items;'), '1');
  db.reject(`delete from public.users where id='${B}';`, /23503/);
  db.reject('delete from public.product_variants where id=7;', /23503/);
  db.sql(`insert into public.cart_operations(cart_id,request_id,operation_type,request_payload,result)
    values ('${CART_B}','${REQUEST1}','remove_items','{}','{}');`);
  db.reject(`delete from public.carts where id='${CART_B}';`, /23503/);
  assert.equal(db.sql('select (select count(*) from public.cart_items),(select count(*) from public.cart_operations);'), '1|1');
});

test('cart timestamp triggers preserve creation times and existing member/catalog objects', options, t => {
  const db = database(t);
  seedCarts(db);
  db.sql(`update public.carts set created_at='2000-01-01',updated_at='2000-01-01',revision=1;
    update public.cart_items set created_at='2000-01-01',updated_at='2000-01-01',quantity=4;`);
  assert.equal(db.sql(`select bool_and(created_at='2000-01-01'::timestamptz and updated_at>'2000-01-01'::timestamptz) from public.carts;`), 't');
  assert.equal(db.sql(`select bool_and(created_at='2000-01-01'::timestamptz and updated_at>'2000-01-01'::timestamptz) from public.cart_items;`), 't');
  assert.equal(db.sql(`select name from public.users where id='${A}';`), '기존 회원');
  assert.equal(db.sql("select count(*) from pg_trigger where tgname='existing_member_hook';"), '1');
  assert.equal(db.sql("select qual from pg_policies where schemaname='public' and tablename='users' and policyname='existing_member_read';"), 'false');
  assert.equal(db.sql('select count(*) from public.products;'), '3');
});

test('empty rollback removes only marked cart objects and preserves catalog and members', options, t => {
  const db = database(t);
  db.sql(rollback());
  assert.equal(db.sql("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('carts','cart_items','cart_operations');"), '0');
  assert.equal(db.sql("select to_regprocedure('private.set_cart_updated_at()') is null;"), 't');
  assert.equal(db.sql('select count(*) from public.products;'), '3');
  assert.equal(db.sql(`select name from public.users where id='${A}';`), '기존 회원');
  assert.equal(db.sql("select to_regprocedure('private.set_catalog_updated_at()') is not null;"), 't');
});

test('rollback refuses data, changed markers and external dependencies atomically', options, t => {
  const populated = database(t);
  seedCarts(populated);
  populated.reject(rollback(), /CART_ROLLBACK_NOT_EMPTY/);
  assert.equal(counts(populated, A), '1|1|1');

  const changed = database(t);
  changed.sql("comment on table public.cart_items is 'unreviewed';");
  changed.reject(rollback(), /CART_ROLLBACK_OBJECT_REVIEW_REQUIRED/);
  assert.equal(changed.sql("select to_regclass('public.carts') is not null and to_regclass('public.cart_items') is not null;"), 't');

  const dependent = database(t);
  dependent.sql('create view public.external_cart_view as select id from public.carts;');
  dependent.reject(rollback(), /2BP01/);
  assert.equal(dependent.sql("select to_regclass('public.cart_operations') is not null and to_regprocedure('private.set_cart_updated_at()') is not null;"), 't');
});

test('migration rejects existing tables, types, functions and recorded history without partial objects', options, t => {
  for (const collision of [
    'create table public.carts(sentinel text);',
    'create domain public.cart_items as integer;',
    'create function private.set_cart_updated_at() returns trigger language plpgsql as $$ begin return new; end $$;',
    'create function public.get_cart() returns integer language sql as $$ select 1 $$;',
    "create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text,name text); insert into supabase_migrations.schema_migrations values ('20261023000000','previous');",
  ]) {
    const db = database(t, { migrate: false });
    db.sql(collision);
    db.reject(migration(), /CART_MIGRATION_(OBJECT_EXISTS|HISTORY_REVIEW_REQUIRED)/);
    assert.equal(db.sql("select to_regclass('public.cart_operations') is null;"), 't');
    assert.equal(db.sql(`select name from public.users where id='${A}';`), '기존 회원');
  }
});

test('preflight inspects current dependencies and cannot write to the database', options, t => {
  const db = database(t, { migrate: false });
  const output = db.sql(preflight());
  assert.match(output, /product_variants/);
  assert.match(output, /users/);
  assert.equal(db.sql("select to_regclass('public.carts') is null;"), 't');
  db.reject(preflight().replace(/commit;\s*$/i, 'create table public.preflight_write_probe(id integer); commit;'), /25006/);
  assert.equal(db.sql("select to_regclass('public.preflight_write_probe') is null;"), 't');
});

const REQUEST2 = '20000000-0000-4000-8000-000000000002';
const REQUEST3 = '20000000-0000-4000-8000-000000000003';
const jsonSql = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const batch = (kind, items) => ({ kind, items });
const item = (productId, variantId, quantity) => ({ productId, variantId, quantity });
const readRpc = expected => `select public.get_cart('${expected}');`;
const mutateRpc = (operation, requestId = REQUEST1, expected = A) =>
  `select public.apply_cart_operation('${expected}','${requestId}',${jsonSql({ version: 1, operation })});`;
const sessionSql = (userId, statement) => `set role authenticated; set request.jwt.claim.sub='${userId}'; ${statement}`;
function snapshot(text) {
  return loadTs('src/domains/cart/schema.ts').parseCartSnapshot(JSON.parse(text));
}
const getCart = (db, user = A) => snapshot(db.as(user, readRpc(user)));
const apply = (db, operation, requestId = REQUEST1, user = A) => snapshot(db.as(user, mutateRpc(operation, requestId, user)));
function memberItems(db, rows = [[I1, 2, 2]]) {
  db.sql(`insert into public.carts(id,user_id) values ('${CART_A}','${A}');`);
  for (const [id, variant, quantity] of rows) db.sql(`insert into public.cart_items(id,cart_id,product_variant_id,quantity)
    values ('${id}','${CART_A}',${variant},${quantity});`);
}

test('RPC initializes one cart across parallel sessions and returns an exact revision string', options, async t => {
  const db = database(t);
  const replies = await db.parallel([sessionSql(A, readRpc(A)), sessionSql(A, readRpc(A))]);
  const carts = replies.map(snapshot);
  assert.equal(carts[0].cart_id, carts[1].cart_id);
  assert.equal(carts[0].owner_id, A);
  assert.deepEqual(carts[0].items, []);
  assert.equal(carts[0].revision, '0');
  assert.equal(db.sql('select count(*) from public.carts;'), '1');
  db.sql("update public.carts set revision=9007199254740993;");
  assert.equal(getCart(db).revision, '9007199254740993');
});

test('RPC checks actual Auth confirmation, active membership and expected account before initialization', options, t => {
  const db = database(t);
  assert.throws(() => db.as(null, readRpc(A)), /42501/);
  assert.throws(() => db.as(A, readRpc(B)), /42501/);
  assert.throws(() => db.as(B, mutateRpc(batch('add_items', [item(1, 2, 1)]))), /42501/);
  db.sql(`update auth.users set email_confirmed_at=null where id='${A}';`);
  assert.throws(() => getCart(db), /42501/); // mirrored public timestamp is deliberately still confirmed
  db.sql(`update auth.users set email_confirmed_at='2026-10-22' where id='${A}';`);
  for (const change of ["status='suspended'", "status='deleted'", 'deleted_at=now()', 'email_verified_at=null']) {
    db.sql(`update public.users set ${change} where id='${A}';`);
    assert.throws(() => apply(db, batch('add_items', [item(1, 2, 1)])), /42501/);
    db.sql(`update public.users set status='active',deleted_at=null,email_verified_at='2026-10-22' where id='${A}';`);
  }
  const missing = '00000000-0000-4000-8000-000000000003';
  assert.throws(() => db.as(missing, readRpc(missing)), /42501/);
  assert.throws(() => db.as(null, readRpc(A), 'anon'), /42501/);
  assert.equal(db.sql('select count(*) from public.carts;'), '0');
  seedCarts(db, { receipts: false });
  assert.equal(apply(db, { kind: 'adjust_quantity', itemId: I2, delta: 1 }).operation.outcome, 'noop');
  assert.equal(apply(db, { kind: 'change_option', itemId: I2, productId: 4, variantId: 17 }, REQUEST2).operation.outcome, 'noop');
  apply(db, { kind: 'remove_items', itemIds: [I2] }, REQUEST3);
  assert.equal(db.sql(`select quantity from public.cart_items where cart_id='${CART_B}' and id='${I2}';`), '3');
  assert.deepEqual(getCart(db).items.map(line => line.id), [I1]);
});

test('raw RPC input rejects malformed numeric values before casts or cart creation', options, t => {
  const db = database(t);
  for (const quantity of [0, -1, 1.5, '2', 2147483648, null]) {
    assert.throws(() => apply(db, batch('add_items', [item(1, 2, quantity)])), /22023/);
  }
  for (const operation of [
    batch('merge_guest', []), batch('add_items', [item('1', 2, 1)]),
    batch('add_items', [item(1, 9007199254740992, 1)]),
    batch('merge_guest', [item(1, 2, 2147483647), item(1, 2, 1)]),
    { kind: 'adjust_quantity', itemId: I1, delta: 0 },
    { kind: 'adjust_quantity', itemId: I1, delta: '1' },
    { kind: 'change_option', itemId: 'bad', productId: 4, variantId: 17 },
    { kind: 'remove_items', itemIds: [] }, { kind: 'remove_items', itemIds: ['bad'] },
    { kind: 'replace_all', items: [] },
  ]) assert.throws(() => apply(db, operation), /22023/);
  for (const payload of [null, [], { version: 2, operation: { kind: 'remove_items', itemIds: [I1] } }]) {
    assert.throws(() => db.as(A, `select public.apply_cart_operation('${A}','${REQUEST1}',${jsonSql(payload)});`), /22023/);
  }
  assert.throws(() => db.as(A, `select public.apply_cart_operation('${A}',null,${jsonSql({ version: 1, operation: batch('add_items', [item(1, 2, 1)]) })});`), /22023/);
  assert.equal(db.sql('select count(*) from public.carts;'), '0');
});

test('raw RPC rejects contract-invalid request UUIDs before cart creation or mutation', options, t => {
  const db = database(t);
  for (const requestId of [
    '20000000-0000-0000-0000-000000000001',
    '20000000-0000-9000-8000-000000000001',
    '20000000-0000-4000-7000-000000000001',
  ]) assert.throws(() => db.as(A, mutateRpc(batch('add_items', [item(1, 2, 1)]), requestId)), /22023/);
  assert.equal(db.sql('select (select count(*) from public.carts),(select count(*) from public.cart_items),(select count(*) from public.cart_operations);'), '0|0|0');
});

test('raw RPC rejects contract-invalid item UUIDs before initializing a cart or recording notices', options, t => {
  const db = database(t);
  for (const itemId of [
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-9000-8000-000000000001',
    '10000000-0000-4000-c000-000000000001',
  ]) for (const operation of [
    { kind: 'adjust_quantity', itemId, delta: 1 },
    { kind: 'change_option', itemId, productId: 4, variantId: 17 },
    { kind: 'remove_items', itemIds: [I1, itemId] },
  ]) assert.throws(() => db.as(A, mutateRpc(operation)), /22023/);
  assert.equal(db.sql('select (select count(*) from public.carts),(select count(*) from public.cart_operations);'), '0|0');
});

test('RPC UUID boundary preserves contract-valid versions, nil and max in parseable snapshots', options, t => {
  const db = database(t);
  const ids = [
    ...[1, 2, 3, 4, 5, 6, 7, 8].map(version => `20000000-0000-${version}000-8000-000000000001`),
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
  ];
  for (const id of ids) {
    const current = apply(db, { kind: 'adjust_quantity', itemId: id, delta: 1 }, id);
    assert.equal(current.operation.requestId, id);
    assert.equal(current.operation.outcome, 'noop');
    assert.deepEqual(current.notices, [{ kind: 'item_missing', itemId: id }]);
    assert.deepEqual(current.items, []);
    assert.equal(current.revision, '0');
  }
  const uppercase = apply(db, {
    kind: 'adjust_quantity', itemId: 'ABCDEF00-0000-4000-A000-000000000001', delta: 1,
  }, 'ABCDEF00-0000-4000-A000-000000000002');
  assert.equal(uppercase.operation.requestId, 'abcdef00-0000-4000-a000-000000000002');
  assert.equal(uppercase.notices[0].itemId, 'abcdef00-0000-4000-a000-000000000001');
  assert.equal(db.sql('select count(*) from public.cart_operations;'), '11');
});

test('replay does not add twice and returns current cart instead of an old receipt snapshot', options, t => {
  const db = database(t);
  memberItems(db);
  const operation = batch('merge_guest', [item(1, 2, 3)]);
  const first = apply(db, operation);
  assert.equal(first.items[0].quantity, 5);
  assert.equal(first.revision, '1');
  assert.equal(apply(db, operation).items[0].quantity, 5);
  assert.equal(db.sql('select count(*) from public.cart_operations;'), '1');
  apply(db, { kind: 'adjust_quantity', itemId: I1, delta: 1 }, REQUEST2);
  const replay = apply(db, operation);
  assert.equal(replay.items[0].quantity, 6);
  assert.equal(replay.revision, '2');
  assert.deepEqual(replay.operation, first.operation);
  assert.throws(() => apply(db, batch('merge_guest', [item(1, 2, 4)])), /CART_REQUEST_CONFLICT/);
  assert.equal(getCart(db).items[0].quantity, 6);
});

test('canonical receipts normalize unordered batches, duplicate quantities and removal IDs', options, t => {
  const db = database(t);
  const first = apply(db, batch('merge_guest', [item(1, 2, 2), item(4, 17, 1), item(1, 2, 3)]));
  const replay = apply(db, batch('merge_guest', [item(4, 17, 1), item(1, 2, 5)]));
  assert.deepEqual(replay.items, first.items);
  assert.equal(replay.revision, first.revision);
  const ids = first.items.map(line => line.id);
  apply(db, { kind: 'remove_items', itemIds: [ids[1], ids[0], ids[0]] }, REQUEST2);
  assert.deepEqual(apply(db, { kind: 'remove_items', itemIds: ids }, REQUEST2).items, []);
  assert.equal(db.sql('select count(*) from public.cart_operations;'), '2');
});

test('mixed batches apply valid items, report each adjustment and preserve old sold-out guest quantities', options, t => {
  const db = database(t);
  db.sql("update public.products set state='inactive' where id=4;");
  const result = apply(db, batch('add_items', [item(1, 2, 12), item(2, 7, 1), item(4, 17, 1)]));
  assert.deepEqual(result.items.map(line => [line.product_variant_id, line.quantity]), [[2, 10]]);
  assert.equal(result.operation.outcome, 'applied');
  assert.ok(result.notices.some(note => note.kind === 'quantity_adjusted' && note.variantId === 2 && note.before === 12 && note.after === 10));
  assert.ok(result.notices.some(note => note.kind === 'sold_out' && note.variantId === 7));
  assert.ok(result.notices.some(note => note.kind === 'unavailable' && note.variantId === 17));
  const guest = apply(db, batch('merge_guest', [item(2, 7, 3), item(4, 17, 2)]), REQUEST2);
  assert.equal(guest.items.find(line => line.product_variant_id === 7).quantity, 3);
  const blocked = apply(db, batch('add_items', [item(2, 7, 2)]), REQUEST3);
  assert.equal(blocked.operation.outcome, 'rejected');
  assert.equal(blocked.items.find(line => line.product_variant_id === 7).quantity, 3);
  const mergedAgain = apply(db, batch('merge_guest', [item(2, 7, 2)]), '20000000-0000-4000-8000-000000000004');
  assert.equal(mergedAgain.items.find(line => line.product_variant_id === 7).quantity, 5);
  assert.equal(db.sql('select stock from public.product_variants where id=7;'), '0');
});

test('get_cart and duplicate mutations share idempotent cleanup and never change actual stock', options, t => {
  const db = database(t);
  memberItems(db, [[I1, 2, 5], [I2, 7, 4]]);
  db.sql('update public.product_variants set stock=2 where id=2;');
  const first = getCart(db);
  assert.deepEqual(first.items.map(line => line.quantity), [2, 4]);
  assert.equal(first.revision, '1');
  assert.ok(first.notices.some(note => note.kind === 'quantity_adjusted' && note.before === 5 && note.after === 2));
  assert.equal(getCart(db).revision, '1');
  apply(db, { kind: 'adjust_quantity', itemId: I1, delta: -1 });
  db.sql("update public.products set state='inactive' where id=1;");
  const replay = apply(db, { kind: 'adjust_quantity', itemId: I1, delta: -1 });
  assert.deepEqual(replay.items.map(line => line.id), [I2]);
  assert.equal(replay.revision, '3');
  assert.equal(apply(db, { kind: 'adjust_quantity', itemId: I1, delta: -1 }).revision, '3');
  assert.equal(db.sql('select stock from public.product_variants where id=2;'), '2');
});

test('parallel deltas use the latest server quantity and parallel request replays run once', options, async t => {
  const db = database(t);
  memberItems(db, [[I1, 2, 4]]);
  db.sql(`create function private.cart_test_pause() returns trigger language plpgsql as $$
    begin perform pg_sleep(0.15); return new; end $$;
    create trigger cart_test_pause before update on public.cart_items for each row execute function private.cart_test_pause();`);
  await db.parallel([
    sessionSql(A, mutateRpc({ kind: 'adjust_quantity', itemId: I1, delta: 1 })),
    sessionSql(A, mutateRpc({ kind: 'adjust_quantity', itemId: I1, delta: 1 }, REQUEST2)),
  ]);
  assert.equal(db.sql(`select quantity from public.cart_items where id='${I1}';`), '6');
  const merge = batch('merge_guest', [item(1, 2, 1)]);
  await db.parallel([sessionSql(A, mutateRpc(merge, REQUEST3)), sessionSql(A, mutateRpc(merge, REQUEST3))]);
  assert.equal(getCart(db).items[0].quantity, 7);
  assert.equal(db.sql('select count(*) from public.cart_operations;'), '3');
});

test('delta minimum and stock-zero rejection are completed without deleting a line', options, t => {
  const db = database(t);
  memberItems(db, [[I1, 2, 1], [I2, 7, 4]]);
  const minimum = apply(db, { kind: 'adjust_quantity', itemId: I1, delta: -1 });
  assert.equal(minimum.operation.outcome, 'noop');
  assert.equal(minimum.revision, '0');
  const soldOut = apply(db, { kind: 'adjust_quantity', itemId: I2, delta: -1 }, REQUEST2);
  assert.equal(soldOut.operation.outcome, 'rejected');
  assert.equal(soldOut.items.find(line => line.id === I2).quantity, 4);
  assert.equal(db.sql('select count(*) from public.cart_operations;'), '2');
});

test('option changes move latest source quantity, merge target IDs and retain originals on rejection', options, t => {
  const db = database(t);
  memberItems(db, [[I1, 2, 4], [I2, 17, 3]]);
  db.sql('update public.product_variants set stock=5 where id=17;');
  const moved = apply(db, { kind: 'change_option', itemId: I1, productId: 4, variantId: 17 });
  assert.deepEqual(moved.items.map(line => [line.id, line.quantity]), [[I2, 5]]);
  assert.equal(moved.operation.itemIdMap[I1], I2);
  const rejected = apply(db, { kind: 'change_option', itemId: I2, productId: 2, variantId: 7 }, REQUEST2);
  assert.equal(rejected.operation.outcome, 'rejected');
  assert.deepEqual(rejected.items.map(line => [line.id, line.quantity]), [[I2, 5]]);
  assert.equal(apply(db, { kind: 'change_option', itemId: I1, productId: 1, variantId: 2 }, REQUEST3).operation.outcome, 'noop');
});

test('option changes use stored quantity before old-option stock cleanup and allow leaving a sold-out option', options, t => {
  const db = database(t);
  memberItems(db, [[I1, 2, 5], [I2, 7, 3]]);
  db.sql('update public.product_variants set stock=2 where id=2;');
  const moved = apply(db, { kind: 'change_option', itemId: I1, productId: 4, variantId: 17 });
  assert.equal(moved.items.find(line => line.product_variant_id === 17).quantity, 5);
  const fromSoldOut = apply(db, { kind: 'change_option', itemId: I2, productId: 4, variantId: 17 }, REQUEST2);
  assert.deepEqual(fromSoldOut.items.map(line => line.quantity), [8]);
});

test('invalid product/option relations and different styles cannot move a source line', options, t => {
  const db = database(t);
  memberItems(db);
  assert.equal(apply(db, { kind: 'change_option', itemId: I1, productId: 1, variantId: 17 }).operation.outcome, 'rejected');
  db.sql("insert into public.product_styles(id,category_id,name) values (2,'cart-test','다른 스타일'); update public.products set style_id=2 where id=4;");
  assert.equal(apply(db, { kind: 'change_option', itemId: I1, productId: 4, variantId: 17 }, REQUEST2).operation.outcome, 'rejected');
  assert.deepEqual(getCart(db).items.map(line => [line.id, line.quantity]), [[I1, 2]]);
});

test('stale item IDs never affect replacements and explicit removals preserve other new items', options, t => {
  const db = database(t);
  memberItems(db);
  apply(db, { kind: 'remove_items', itemIds: [I1] });
  const added = apply(db, batch('add_items', [item(1, 2, 3), item(4, 17, 1)]), REQUEST2);
  const replacement = added.items.find(line => line.product_variant_id === 2);
  assert.notEqual(replacement.id, I1);
  const stale = apply(db, { kind: 'adjust_quantity', itemId: I1, delta: 1 }, REQUEST3);
  assert.equal(stale.items.find(line => line.id === replacement.id).quantity, 3);
  const request4 = '20000000-0000-4000-8000-000000000004';
  const staleRemoval = apply(db, { kind: 'remove_items', itemIds: [I1] }, request4);
  assert.equal(staleRemoval.items.find(line => line.id === replacement.id).quantity, 3);
  const request5 = '20000000-0000-4000-8000-000000000005';
  const staleMove = apply(db, { kind: 'change_option', itemId: I1, productId: 4, variantId: 17 }, request5);
  assert.equal(staleMove.items.find(line => line.id === replacement.id).quantity, 3);
  const removed = apply(db, { kind: 'remove_items', itemIds: [replacement.id] }, '20000000-0000-4000-8000-000000000006');
  assert.deepEqual(removed.items.map(line => line.product_variant_id), [17]);
});

test('cart order survives quantity changes, merges and receipt replay', options, t => {
  const db = database(t);
  memberItems(db, [[I1, 2, 2], [I2, 17, 3]]);
  db.sql(`update public.cart_items set created_at=case when id='${I1}' then '2001-01-01'::timestamptz else '2000-01-01'::timestamptz end;`);
  assert.deepEqual(getCart(db).items.map(line => line.id), [I2, I1]);
  db.sql("update public.cart_items set created_at='2000-01-01';");
  const before = getCart(db);
  const operation = batch('add_items', [item(4, 17, 1)]);
  assert.deepEqual(apply(db, operation).items.map(line => line.id), [I1, I2]);
  assert.deepEqual(apply(db, operation).items.map(line => line.id), [I1, I2]);
  assert.equal(db.sql("select bool_and(created_at='2000-01-01'::timestamptz) from public.cart_items;"), 't');
  assert.deepEqual(before.items.map(line => line.id), [I1, I2]);
});

test('last receipt failure rolls back items, revision and receipt as one transaction', options, t => {
  const db = database(t);
  memberItems(db);
  db.sql(`create function private.cart_test_reject_receipt() returns trigger language plpgsql as $$
    begin raise exception 'TEST_RECEIPT_FAILURE'; end $$;
    create trigger cart_test_reject_receipt before insert on public.cart_operations
      for each row execute function private.cart_test_reject_receipt();`);
  assert.throws(() => apply(db, batch('merge_guest', [item(1, 2, 3)])), /TEST_RECEIPT_FAILURE/);
  assert.equal(getCart(db).items[0].quantity, 2);
  assert.equal(getCart(db).revision, '0');
  assert.equal(db.sql('select count(*) from public.cart_operations;'), '0');
});

test('only authenticated may invoke public RPCs and private helpers remain inaccessible', options, t => {
  const db = database(t);
  assert.equal(db.sql(`select has_function_privilege('authenticated','public.get_cart(uuid)','execute')
    and has_function_privilege('authenticated','public.apply_cart_operation(uuid,uuid,jsonb)','execute')
    and not has_function_privilege('anon','public.get_cart(uuid)','execute')
    and not has_function_privilege('anon','public.apply_cart_operation(uuid,uuid,jsonb)','execute');`), 't');
  assert.equal(db.sql(`select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='private' and (p.proname like 'cart_%' or p.proname='set_cart_updated_at')
      and has_function_privilege('authenticated',p.oid,'execute');`), '0');
  assert.equal(db.sql(`select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in ('get_cart','apply_cart_operation')
      and p.prosecdef and p.proconfig @> array['search_path=pg_catalog'];`), '2');
});
