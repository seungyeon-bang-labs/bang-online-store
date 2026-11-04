import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { database } from './helpers/cart-db.mjs';
import { A, I1, I2, CART_A, REQUEST1 } from './helpers/cart-fixtures.mjs';
import { loadTs } from './helpers/load-ts.mjs';

const options = { skip: !process.env.CART_TEST_CONTAINER && 'Set CART_TEST_CONTAINER to an isolated bang-cart-test-* container; never a remote database.' };
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const keepQuantities = () => read('../supabase/migrations/20261103000000_cart_keep_quantities.sql');
const lookup = () => read('../supabase/migrations/20261104000000_cart_discontinued_lines.sql');
const lookupRollback = () => read('../supabase/rollback/20261104000000_cart_discontinued_lines.sql');
const keep = () => read('../supabase/migrations/20261104010000_cart_keep_discontinued.sql');
const keepRollback = () => read('../supabase/rollback/20261104010000_cart_keep_discontinued.sql');
const REQUEST2 = '20000000-0000-4000-8000-000000000002';
const REQUEST3 = '20000000-0000-4000-8000-000000000003';
const jsonSql = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const snapshot = text => loadTs('src/domains/cart/schema.ts').parseCartSnapshot(JSON.parse(text));
const getCart = db => snapshot(db.as(A, `select public.get_cart('${A}');`));
const apply = (db, operation, requestId = REQUEST1) =>
  snapshot(db.as(A, `select public.apply_cart_operation('${A}','${requestId}',${jsonSql({ version: 1, operation })});`));
const quantities = cart => cart.items.map(line => [line.product_variant_id, line.quantity]).sort((a, b) => a[0] - b[0]);
const discontinued = (db, items, role = 'anon') =>
  JSON.parse(db.as(null, `select public.get_discontinued_cart_lines(${jsonSql(items)});`, role));
const definitions = db => db.sql(`select md5(pg_get_functiondef('private.cart_cleanup(uuid)'::regprocedure))
  ||md5(pg_get_functiondef('public.apply_cart_operation(uuid,uuid,jsonb)'::regprocedure));`);
const markers = db => db.sql(`select concat_ws('|',
  obj_description('private.cart_cleanup(uuid)'::regprocedure,'pg_proc'),
  obj_description('public.apply_cart_operation(uuid,uuid,jsonb)'::regprocedure,'pg_proc'));`);

// Product 1 (variant 2) is discontinued in these tests; product 4 (variant 17) stays on sale.
function setup(t, rows = []) {
  const db = database(t);
  db.sql(keepQuantities());
  db.sql(lookup());
  db.sql(keep());
  db.sql(`insert into public.product_images(id,product_id,image_path,image_type,display_order) values
    (1,1,'products/1/detail-0.png','detail',0),(2,1,'products/1/thumb.png','thumbnail',1);`);
  db.sql(`insert into public.carts(id,user_id) values ('${CART_A}','${A}');`);
  for (const [id, variant, quantity] of rows) db.sql(`insert into public.cart_items(id,cart_id,product_variant_id,quantity)
    values ('${id}','${CART_A}',${variant},${quantity});`);
  db.sql("update public.products set state='inactive' where id=1;");
  return db;
}

test('the lookup returns only discontinued requested pairs, with the fields a cart card needs', options, t => {
  const db = setup(t);
  const rows = discontinued(db, [
    { productId: 1, variantId: 2 }, { productId: 1, variantId: 2 },
    { productId: 4, variantId: 17 }, { productId: 2, variantId: 2 }, { productId: 1, variantId: 999 },
  ]);
  assert.deepEqual(rows, [{
    productId: 1, variantId: 2, styleId: 1, name: '그레이 티셔츠', color: '그레이', size: 'M',
    price: 10000, priceOffset: 1000, stock: 10, imagePath: 'products/1/thumb.png',
  }], 'on-sale, mismatched and missing pairs are left out; duplicates collapse');
  assert.deepEqual(discontinued(db, [{ productId: 1, variantId: 2 }], 'authenticated').length, 1);
  db.sql('delete from public.product_images where id=2;');
  assert.equal(discontinued(db, [{ productId: 1, variantId: 2 }])[0].imagePath, 'products/1/detail-0.png');
  db.sql('delete from public.product_images;');
  assert.equal(discontinued(db, [{ productId: 1, variantId: 2 }])[0].imagePath, null);
  assert.deepEqual(discontinued(db, []), []);
  const tooMany = Array.from({ length: 501 }, () => ({ productId: 1, variantId: 2 }));
  db.reject(`set role anon; select public.get_discontinued_cart_lines(${jsonSql(tooMany)});`, /CART_INVALID_REQUEST/);
  db.reject(`set role anon; select public.get_discontinued_cart_lines('{}'::jsonb);`, /CART_INVALID_REQUEST/);
});

test('reading the cart keeps a discontinued line without a notice or a new revision', options, t => {
  const db = setup(t, [[I1, 2, 3], [I2, 17, 1]]);
  const cart = getCart(db);
  assert.deepEqual(quantities(cart), [[2, 3], [17, 1]]);
  assert.deepEqual(cart.notices, []);
  assert.equal(cart.revision, '0');
});

test('a login merge moves a discontinued line; adding one and changing its quantity are refused', options, t => {
  const db = setup(t, [[I2, 17, 1]]);
  const added = apply(db, { kind: 'add_items', items: [{ productId: 1, variantId: 2, quantity: 1 }] });
  assert.equal(added.operation.outcome, 'rejected');
  assert.deepEqual(quantities(added), [[17, 1]]);
  const merged = apply(db, { kind: 'merge_guest', items: [
    { productId: 1, variantId: 2, quantity: 4 }, { productId: 4, variantId: 17, quantity: 2 },
  ] }, REQUEST2);
  assert.deepEqual(quantities(merged), [[2, 4], [17, 3]]);
  assert.deepEqual(merged.notices, []);
  assert.deepEqual(quantities(getCart(db)), [[2, 4], [17, 3]]);
  const line = merged.items.find(item => item.product_variant_id === 2);
  const adjusted = apply(db, { kind: 'adjust_quantity', itemId: line.id, delta: -1 }, REQUEST3);
  assert.equal(adjusted.operation.outcome, 'rejected');
  assert.equal(adjusted.items.find(item => item.id === line.id).quantity, 4);
});

test('migrations apply in order, keep grants and roll back to the stage-one definitions', options, t => {
  const db = database(t);
  db.sql(keepQuantities());
  const stageOne = definitions(db);
  db.reject(keep(), /CART_KEEP_DISCONTINUED_DEPENDENCY_REQUIRED/);
  db.sql(lookup());
  db.reject(lookup(), /CART_DISCONTINUED_LINES_OBJECT_EXISTS/);
  assert.equal(db.sql("select has_function_privilege('anon','public.get_discontinued_cart_lines(jsonb)','execute');"), 't');
  assert.equal(db.sql("select has_function_privilege('authenticated','public.get_discontinued_cart_lines(jsonb)','execute');"), 't');
  assert.equal(db.sql("select has_function_privilege('service_role','public.get_discontinued_cart_lines(jsonb)','execute');"), 'f');
  db.sql(keep());
  assert.equal(markers(db), 'bang_cart_keep_discontinued_20261104010000|bang_cart_keep_discontinued_20261104010000');
  assert.notEqual(definitions(db), stageOne);
  assert.equal(db.sql("select has_function_privilege('authenticated','private.cart_cleanup(uuid)','execute');"), 'f');
  assert.equal(db.sql("select has_function_privilege('authenticated','public.apply_cart_operation(uuid,uuid,jsonb)','execute');"), 't');
  assert.equal(db.sql("select has_function_privilege('anon','public.apply_cart_operation(uuid,uuid,jsonb)','execute');"), 'f');
  db.reject(keep(), /CART_KEEP_DISCONTINUED_REVIEW_REQUIRED/);
  db.reject(lookupRollback(), /CART_DISCONTINUED_LINES_ROLLBACK_ORDER/);
  db.sql(keepRollback());
  assert.equal(definitions(db), stageOne);
  assert.equal(markers(db), 'bang_cart_keep_quantities_20261103000000|bang_cart_keep_quantities_20261103000000');
  db.reject(keepRollback(), /CART_KEEP_DISCONTINUED_ROLLBACK_REVIEW_REQUIRED/);
  db.sql(lookupRollback());
  assert.equal(db.sql("select to_regprocedure('public.get_discontinued_cart_lines(jsonb)') is null;"), 't');
});

test('after rollback the stage-one cleanup removes the kept discontinued line on the next read', options, t => {
  const db = setup(t, [[I1, 2, 3]]);
  db.sql(keepRollback());
  const cart = getCart(db);
  assert.deepEqual(cart.items, []);
  assert.ok(cart.notices.some(note => note.kind === 'unavailable' && note.itemId === I1));
});
