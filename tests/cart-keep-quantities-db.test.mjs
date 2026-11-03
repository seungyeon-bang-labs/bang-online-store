import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { database } from './helpers/cart-db.mjs';
import { A, I1, I2, CART_A, REQUEST1 } from './helpers/cart-fixtures.mjs';
import { loadTs } from './helpers/load-ts.mjs';
import { addCases, adjustCases, optionCases } from './helpers/cart-quantity-cases.mjs';

const options = { skip: !process.env.CART_TEST_CONTAINER && 'Set CART_TEST_CONTAINER to an isolated bang-cart-test-* container; never a remote database.' };
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const migration = () => read('../supabase/migrations/20261103000000_cart_keep_quantities.sql');
const rollback = () => read('../supabase/rollback/20261103000000_cart_keep_quantities.sql');
const REQUEST2 = '20000000-0000-4000-8000-000000000002';
const REQUEST3 = '20000000-0000-4000-8000-000000000003';
const jsonSql = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const snapshot = text => loadTs('src/domains/cart/schema.ts').parseCartSnapshot(JSON.parse(text));
const getCart = db => snapshot(db.as(A, `select public.get_cart('${A}');`));
const apply = (db, operation, requestId = REQUEST1) =>
  snapshot(db.as(A, `select public.apply_cart_operation('${A}','${requestId}',${jsonSql({ version: 1, operation })});`));
// Lines added in one operation share created_at and then sort by random id, so compare by variant.
const quantities = cart => cart.items.map(line => [line.product_variant_id, line.quantity]).sort((a, b) => a[0] - b[0]);
const adjusted = cart => cart.notices.filter(note => note.kind === 'quantity_adjusted');
const definitions = db => db.sql(`select md5(pg_get_functiondef('private.cart_cleanup(uuid)'::regprocedure))
  ||md5(pg_get_functiondef('public.apply_cart_operation(uuid,uuid,jsonb)'::regprocedure));`);
const markers = db => db.sql(`select concat_ws('|',
  obj_description('private.cart_cleanup(uuid)'::regprocedure,'pg_proc'),
  obj_description('public.apply_cart_operation(uuid,uuid,jsonb)'::regprocedure,'pg_proc'));`);

// Variant 2 (product 1) has stock 2 in these tests; variant 7 (product 2) is sold out; variant 17 (product 4) has 10.
function memberItems(db, rows) {
  db.sql(`insert into public.carts(id,user_id) values ('${CART_A}','${A}');`);
  for (const [id, variant, quantity] of rows) db.sql(`insert into public.cart_items(id,cart_id,product_variant_id,quantity)
    values ('${id}','${CART_A}',${variant},${quantity});`);
}
function setup(t, rows) {
  const db = database(t);
  db.sql(migration());
  db.sql('update public.product_variants set stock=2 where id=2;');
  if (rows) memberItems(db, rows);
  return db;
}

// The same table runs against applyGuestChange in cart-guest.test.mjs.
test('member quantities follow the shared rule table', options, t => {
  const db = setup(t, []);
  let request = 100;
  const run = (rows, stock, operation) => {
    db.sql(`delete from public.cart_items; update public.product_variants set stock=${stock} where id=2;`);
    for (const [id, variant, quantity] of rows) db.sql(`insert into public.cart_items(id,cart_id,product_variant_id,quantity)
      values ('${id}','${CART_A}',${variant},${quantity});`);
    return quantities(apply(db, operation, `20000000-0000-4000-8000-${String(++request).padStart(12, '0')}`));
  };
  for (const c of adjustCases)
    assert.deepEqual(run([[I1, 2, c.line]], c.stock, { kind: 'adjust_quantity', itemId: I1, delta: c.delta }), [[2, c.expected]], c.name);
  for (const c of addCases)
    assert.deepEqual(run(c.line ? [[I1, 2, c.line]] : [], c.stock, { kind: 'add_items', items: [{ productId: 1, variantId: 2, quantity: c.added }] }),
      [[2, c.expected]], c.name);
  for (const c of optionCases)
    assert.deepEqual(run([[I1, 17, c.line], ...(c.target ? [[I2, 2, c.target]] : [])], c.stock,
      { kind: 'change_option', itemId: I1, productId: 1, variantId: 2 }), [[2, c.expected]], c.name);
});

test('reading the cart keeps over-stock and sold-out quantities but still removes inactive lines', options, t => {
  const db = setup(t, [[I1, 2, 5], [I2, 7, 4]]);
  const read = getCart(db);
  assert.deepEqual(read.items.map(line => [line.id, line.quantity]), [[I1, 5], [I2, 4]]);
  assert.deepEqual(read.notices, []);
  assert.equal(read.revision, '0');
  db.sql("update public.products set state='inactive' where id=1;");
  const removed = getCart(db);
  assert.deepEqual(removed.items.map(line => line.id), [I2]);
  assert.ok(removed.notices.some(note => note.kind === 'unavailable' && note.itemId === I1));
  assert.equal(db.sql('select stock from public.product_variants where id=2;'), '2');
});

test('one decrease from above stock lands on stock without an adjustment notice; an increase never lowers it', options, t => {
  const db = setup(t, [[I1, 2, 5], [I2, 7, 4]]);
  const increased = apply(db, { kind: 'adjust_quantity', itemId: I1, delta: 1 });
  assert.deepEqual(quantities(increased), [[2, 5], [7, 4]]);
  assert.equal(increased.operation.outcome, 'noop');
  const decreased = apply(db, { kind: 'adjust_quantity', itemId: I1, delta: -1 }, REQUEST2);
  assert.deepEqual(quantities(decreased), [[2, 2], [7, 4]]);
  assert.equal(decreased.operation.outcome, 'applied');
  assert.deepEqual(adjusted(decreased), []);
  const capped = apply(db, { kind: 'adjust_quantity', itemId: I1, delta: 1 }, REQUEST3);
  assert.equal(capped.items.find(line => line.id === I1).quantity, 2);
  assert.equal(adjusted(capped).length, 1, 'a refused increase is still reported');
  const soldOut = apply(db, { kind: 'adjust_quantity', itemId: I2, delta: -1 }, '20000000-0000-4000-8000-000000000004');
  assert.equal(soldOut.operation.outcome, 'rejected');
  assert.equal(soldOut.items.find(line => line.id === I2).quantity, 4);
});

test('adding holds only the added quantity to stock and never lowers a line already above it', options, t => {
  const db = setup(t, [[I1, 2, 5]]);
  const onOver = apply(db, { kind: 'add_items', items: [{ productId: 1, variantId: 2, quantity: 1 }] });
  assert.deepEqual(quantities(onOver), [[2, 5]]);
  assert.deepEqual(adjusted(onOver).map(note => [note.before, note.after]), [[6, 5]]);
  const fresh = apply(db, { kind: 'add_items', items: [{ productId: 4, variantId: 17, quantity: 12 }] }, REQUEST2);
  assert.deepEqual(quantities(fresh), [[2, 5], [17, 10]]);
  const other = setup(t, [[I1, 2, 1]]);
  assert.deepEqual(quantities(apply(other, { kind: 'add_items', items: [{ productId: 1, variantId: 2, quantity: 3 }] })), [[2, 2]]);
});

test('a login merge moves guest quantities as they are, above stock or sold out', options, t => {
  const db = setup(t, [[I1, 2, 1]]);
  const merged = apply(db, { kind: 'merge_guest', items: [
    { productId: 1, variantId: 2, quantity: 4 },
    { productId: 2, variantId: 7, quantity: 3 },
    { productId: 4, variantId: 17, quantity: 12 },
  ] });
  assert.deepEqual(quantities(merged), [[2, 5], [7, 3], [17, 12]]);
  assert.deepEqual(adjusted(merged), []);
  assert.deepEqual(quantities(getCart(db)), [[2, 5], [7, 3], [17, 12]]);
});

test('an option change holds the moved quantity to stock but keeps a target line already above it', options, t => {
  const db = setup(t, [[I1, 17, 3], [I2, 2, 5]]);
  db.sql('update public.product_variants set stock=1 where id=2;');
  const merged = apply(db, { kind: 'change_option', itemId: I1, productId: 1, variantId: 2 });
  assert.deepEqual(quantities(merged), [[2, 5]]);
  const fresh = setup(t, [[I1, 17, 5]]);
  assert.deepEqual(quantities(apply(fresh, { kind: 'change_option', itemId: I1, productId: 1, variantId: 2 })), [[2, 2]]);
});

test('migration keeps grants, refuses an unreviewed cart and rolls back to the original definitions', options, t => {
  const db = database(t);
  const original = definitions(db);
  db.sql(migration());
  assert.equal(markers(db), 'bang_cart_keep_quantities_20261103000000|bang_cart_keep_quantities_20261103000000');
  assert.notEqual(definitions(db), original);
  assert.equal(db.sql("select has_function_privilege('authenticated','private.cart_cleanup(uuid)','execute');"), 'f');
  assert.equal(db.sql("select has_function_privilege('authenticated','public.apply_cart_operation(uuid,uuid,jsonb)','execute');"), 't');
  assert.equal(db.sql("select has_function_privilege('anon','public.apply_cart_operation(uuid,uuid,jsonb)','execute');"), 'f');
  db.reject(migration(), /CART_KEEP_QUANTITIES_REVIEW_REQUIRED/);
  db.sql(rollback());
  assert.equal(definitions(db), original);
  assert.equal(markers(db), 'bang_cart_20261023000000|bang_cart_20261023000000');
  db.reject(rollback(), /CART_KEEP_QUANTITIES_ROLLBACK_REVIEW_REQUIRED/);
});
