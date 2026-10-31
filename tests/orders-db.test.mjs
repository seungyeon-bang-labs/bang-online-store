import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { database } from './helpers/cart-db.mjs';
import { A, B, I1, I2, CART_A, CART_B } from './helpers/cart-fixtures.mjs';
import { loadTs } from './helpers/load-ts.mjs';

const options = { skip: !process.env.CART_TEST_CONTAINER && 'Set CART_TEST_CONTAINER to an isolated bang-cart-test-* container; never a remote database.' };
const read = file => readFileSync(new URL(file, import.meta.url), 'utf8');
const migration = () => read('../supabase/migrations/20261031120000_orders.sql');
const rollback = () => read('../supabase/rollback/20261031120000_orders.sql');
const preflight = () => read('../supabase/checks/orders-preflight.sql');

const ADDRESS_A = '40000000-0000-4000-8000-000000000001';
const ADDRESS_B = '40000000-0000-4000-8000-000000000002';
const I3 = '10000000-0000-4000-8000-000000000003';
const R1 = '50000000-0000-4000-8000-000000000001';
const R2 = '50000000-0000-4000-8000-000000000002';

// Catalog from the cart helper: product 1 (10,000원, variant 2: stock 10, +1,000원),
// product 2 (variant 7: stock 0) and product 4 (10,000원, variant 17: stock 10).
function orders(t) {
  const db = database(t);
  db.sql(read('../supabase/migrations/20261019000000_product_merchandising.sql'));
  db.sql(read('../supabase/migrations/20261031000000_user_addresses.sql'));
  db.sql(migration());
  db.sql(`
    insert into public.user_addresses(id,user_id,recipient_name,phone_number,postal_code,address_line_1,address_line_2)
      values ('${ADDRESS_A}','${A}','가회원','010-1111-2222','06134','서울특별시 강남구 테헤란로 1','101호'),
        ('${ADDRESS_B}','${B}','나회원','010-3333-4444','04524','서울특별시 중구 세종대로 1','201호');
    insert into public.carts(id,user_id) values ('${CART_A}','${A}'),('${CART_B}','${B}');
    insert into public.cart_items(id,cart_id,product_variant_id,quantity) values
      ('${I1}','${CART_A}',2,2),('${I3}','${CART_A}',17,1),('${I2}','${CART_B}',17,1);
  `);
  return db;
}

const place = (db, { user = A, request = R1, items = [I1], address = ADDRESS_A, method = 'card', total = 25000 } = {}) =>
  db.as(user, `select public.place_order('${user}','${request}',array[${items.map(id => `'${id}'`).join(',')}]::uuid[],
    '${address}','${method}',${total});`);

function snapshot(db) {
  return db.sql(`select concat_ws('|',
    (select string_agg(id||':'||stock,',' order by id) from public.product_variants),
    (select string_agg(id::text,',' order by id) from public.cart_items),
    (select count(*) from public.orders),(select count(*) from public.order_items),
    (select count(*) from public.order_status_histories),(select count(*) from public.order_payment_transactions));`);
}

test('orders start empty with RLS, read-only grants, indexes and migration markers', options, t => {
  const db = orders(t);
  assert.equal(db.sql(`select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relrowsecurity and obj_description(c.oid,'pg_class')='bang_orders_20261031120000';`), '4');
  assert.equal(db.sql(`select string_agg(distinct privilege_type,',') from information_schema.role_table_grants
    where table_schema='public' and grantee in ('anon','authenticated') and table_name in
      ('orders','order_items','order_status_histories','order_payment_transactions');`), 'SELECT');
  assert.equal(db.sql(`select count(*) from pg_indexes where schemaname='public' and indexname in
    ('orders_user_ordered_at_idx','order_status_histories_order_idx','order_payment_transactions_order_idx');`), '3');
  assert.equal(db.sql(`select has_function_privilege('authenticated','public.place_order(uuid,uuid,uuid[],uuid,text,integer)','EXECUTE'),
    has_function_privilege('anon','public.place_order(uuid,uuid,uuid[],uuid,text,integer)','EXECUTE'),
    has_function_privilege('authenticated','private.order_confirm_payment(uuid,integer,timestamptz,jsonb)','EXECUTE');`), 't|f|f');
  db.as(A, `select count(*) from public.orders;`);
  for (const statement of [
    `insert into public.orders default values;`,
    `update public.product_variants set stock=0;`,
    `select private.order_confirm_payment('${R1}',1,now(),null);`,
  ]) assert.throws(() => db.as(A, statement), /42501|permission denied/);
});

test('a card order snapshots prices and the address, takes stock and empties the ordered lines', options, t => {
  const db = orders(t);
  const result = JSON.parse(place(db));
  assert.equal(result.total_amount, 25000);
  assert.equal(result.replayed, false);
  assert.match(result.order_number, /^\d{8}-\d{6}$/);
  assert.equal(db.sql(`select concat_ws('|',status,payment_method,subtotal_amount,discount_amount,shipping_fee,total_amount,
    paid_at is not null,recipient_name,shipping_address_line_2,request_id) from public.orders;`),
    `payment_completed|card|22000|0|3000|25000|t|가회원|101호|${R1}`);
  assert.equal(db.sql(`select concat_ws('|',product_name,option_label,quantity,unit_price,discount_amount,line_total_amount)
    from public.order_items;`), '그레이 티셔츠|그레이 / M|2|11000|0|22000');
  assert.equal(db.sql(`select string_agg(status::text,',') from public.order_status_histories;`), 'payment_completed');
  assert.equal(db.sql(`select concat_ws('|',type,amount,payment_method,receipt_details is null) from public.order_payment_transactions;`),
    'payment|25000|card|t');
  assert.equal(db.sql('select stock from public.product_variants where id=2;'), '8');
  assert.equal(db.sql("select string_agg(id::text,',' order by id) from public.cart_items;"), `${I2},${I3}`);
  assert.equal(db.sql(`select revision from public.carts where id='${CART_A}';`), '1');

  db.sql(`update public.products set display_name='바뀐 이름',price=99000 where id=1;
    update public.user_addresses set address_line_2='바뀐 호수' where id='${ADDRESS_A}';`);
  assert.equal(db.sql('select product_name||unit_price from public.order_items;'), '그레이 티셔츠11000');
  assert.equal(db.sql('select shipping_address_line_2 from public.orders;'), '101호');
});

test('the same request id returns the first order once and never takes stock twice', options, t => {
  const db = orders(t);
  const first = JSON.parse(place(db, { total: 25000 }));
  const again = JSON.parse(place(db, { total: 25000 }));
  assert.equal(again.order_id, first.order_id);
  assert.equal(again.replayed, true);
  assert.equal(db.sql('select count(*)||\'|\'||(select stock from public.product_variants where id=2) from public.orders;'), '1|8');
});

test('ordering rejects foreign, missing, unavailable, sold out and repriced lines without changes', options, t => {
  const db = orders(t);
  const before = snapshot(db);
  for (const [input, pattern] of [
    [{ items: [I2] }, /ORDER_CART_ITEM_NOT_FOUND/],
    [{ items: [] }, /ORDER_INVALID_REQUEST/],
    [{ items: [I1, I1] }, /ORDER_INVALID_REQUEST/],
    [{ address: ADDRESS_B }, /ORDER_ADDRESS_NOT_FOUND/],
    [{ method: 'bank_transfer' }, /ORDER_PAYMENT_METHOD_UNAVAILABLE/],
    [{ total: 24999 }, /ORDER_PRICE_CHANGED.*"totalAmount": 25000/s],
  ]) assert.throws(() => place(db, { total: 25000, ...input }), pattern);
  assert.throws(() => db.as(A, `select public.place_order('${A}','${R1}',array['${I1}']::uuid[],'${ADDRESS_A}',null,25000);`),
    /ORDER_PAYMENT_METHOD_UNAVAILABLE/);
  assert.throws(() => db.as(A, `select public.place_order('${B}','${R1}',array['${I1}']::uuid[],'${ADDRESS_A}','card',25000);`),
    /CART_ACCESS_DENIED/);

  db.sql('update public.product_variants set stock=1 where id=2;');
  assert.throws(() => place(db, { total: 25000 }), /ORDER_OUT_OF_STOCK.*"variantIds": \[2\]/s);
  db.sql(`update public.product_variants set stock=10 where id=2; update public.products set state='inactive' where id=1;`);
  assert.throws(() => place(db, { total: 25000 }), /ORDER_PRODUCT_UNAVAILABLE.*"variantIds": \[2\]/s);
  db.sql(`update public.products set state='active' where id=1; update public.user_addresses set address_line_2=null where id='${ADDRESS_A}';`);
  assert.throws(() => place(db, { total: 25000 }), /ORDER_ADDRESS_INCOMPLETE/);
  db.sql(`update public.users set status='suspended' where id='${A}';`);
  assert.throws(() => place(db, { total: 25000 }), /CART_ACCESS_DENIED/);
  db.sql(`update public.users set status='active' where id='${A}';
    update public.user_addresses set address_line_2='101호' where id='${ADDRESS_A}';
    insert into public.discounts(id,title,starts_at,ends_at) values (9,'전액',now()-interval '1 day',now()+interval '1 day');
    insert into public.discount_items(discount_id,product_id,discount_rate) values (9,4,100);`);
  assert.throws(() => place(db, { items: [I3], total: 0 }), /ORDER_ZERO_TOTAL/);
  db.sql('delete from public.discount_items where discount_id=9; delete from public.discounts where id=9;');
  db.sql(`update public.users set status='active' where id='${A}';
    update public.user_addresses set address_line_2='101호' where id='${ADDRESS_A}';`);
  assert.equal(snapshot(db), before);
});

test('two members racing for the last unit leave exactly one order and no negative stock', options, async t => {
  const db = orders(t);
  db.sql('update public.product_variants set stock=1 where id=17;');
  const results = await Promise.allSettled([
    db.parallel([`set role authenticated; set request.jwt.claim.sub='${A}';
      select public.place_order('${A}','${R1}',array['${I3}']::uuid[],'${ADDRESS_A}','card',13000);`])
      .then(([out]) => out),
    db.parallel([`set role authenticated; set request.jwt.claim.sub='${B}';
      select public.place_order('${B}','${R2}',array['${I2}']::uuid[],'${ADDRESS_B}','card',13000);`])
      .then(([out]) => out),
  ]);
  assert.deepEqual(results.map(result => result.status).sort(), ['fulfilled', 'rejected']);
  assert.match(String(results.find(result => result.status === 'rejected').reason), /ORDER_OUT_OF_STOCK/);
  assert.equal(db.sql('select count(*)||\'|\'||(select stock from public.product_variants where id=17) from public.orders;'), '1|0');
});

test('members read only their own orders and order rows, and nothing while suspended', options, t => {
  const db = orders(t);
  place(db, { total: 25000 });
  place(db, { user: B, request: R2, items: [I2], address: ADDRESS_B, total: 13000 });
  const visible = user => db.as(user, `select concat_ws('|',
    (select count(*) from public.orders),(select count(*) from public.order_items),
    (select count(*) from public.order_status_histories),(select count(*) from public.order_payment_transactions));`);
  assert.equal(visible(A), '1|1|1|1');
  assert.equal(visible(B), '1|1|1|1');
  assert.equal(db.as(null, 'select count(*) from public.orders;', 'authenticated'), '0');
  db.sql(`update public.users set status='suspended' where id='${A}';`);
  assert.equal(visible(A), '0|0|0|0');
});

test('order constraints reject inconsistent amounts, states and payment methods', options, t => {
  const db = orders(t);
  place(db, { total: 25000 });
  for (const statement of [
    'update public.orders set total_amount=1;',
    'update public.orders set discount_amount=subtotal_amount+1;',
    'update public.orders set paid_at=null;',
    "update public.orders set status='pending_payment',payment_due_at=null;",
    "update public.orders set status='delivered';",
    "update public.orders set status='cancelled';",
    "update public.orders set order_number='DEMO-1';",
    "update public.orders set shipping_address_line_2='';",
    'update public.order_items set line_total_amount=line_total_amount+1;',
    'update public.order_items set quantity=0;',
    'update public.order_payment_transactions set amount=0;',
    "update public.order_payment_transactions set receipt_details='[]';",
  ]) db.reject(statement, /23514/);
  db.reject("update public.orders set status='shipped';", /22P02/);
  db.reject("update public.orders set payment_method='bank_transfer';", /22P02/);
  db.reject('delete from public.product_variants where id=2;', /23503/);
});

test('order amounts match the TypeScript cart and shipping rules', options, t => {
  const db = orders(t);
  const { getProductLinePrice } = loadTs('src/domains/product/domain.ts');
  const { getOrderShippingFee } = loadTs('src/domains/order/domain.ts');
  const expected = lines => {
    const priced = lines.map(line => getProductLinePrice(line.price, line.rate, line.offset, line.quantity));
    const subtotal = priced.reduce((sum, line) => sum + line.originalTotal, 0);
    const discount = priced.reduce((sum, line) => sum + line.discountAmount, 0);
    return { subtotal, discount, shipping: getOrderShippingFee(subtotal - discount),
      total: subtotal - discount + getOrderShippingFee(subtotal - discount) };
  };
  db.sql(`insert into public.discounts(id,title,starts_at,ends_at,priority,is_active) values
      (1,'낮은 우선순위',now()-interval '1 day',now()+interval '1 day',1,true),
      (2,'높은 우선순위',now()-interval '1 day',now()+interval '1 day',5,true),
      (3,'꺼진 할인',now()-interval '1 day',now()+interval '1 day',9,false),
      (4,'끝난 할인',now()-interval '2 day',now()-interval '1 day',9,true);
    insert into public.discount_items(discount_id,product_id,discount_rate) values
      (1,1,10),(2,1,15),(3,1,90),(4,1,90),(1,4,33);`);

  const cases = [
    // [product 1 price, quantity, product 4 price]: around the 50,000원 boundary, with and without option offsets.
    { price1: 11999, quantity: 4, price4: 9999 },
    // 42,500 + 1,000 + floor(9,702 × 0.67) = exactly 50,000원; 9,700 gives 49,999원.
    { price1: 50000, quantity: 1, price4: 9702 },
    { price1: 50000, quantity: 1, price4: 9700 },
    { price1: 49999, quantity: 1, price4: 0 },
    { price1: 33333, quantity: 3, price4: 12345 },
  ];
  cases.forEach(({ price1, quantity, price4 }, index) => {
    const request = `60000000-0000-4000-8000-00000000000${index + 1}`;
    db.sql(`update public.products set price=${price1} where id=1; update public.products set price=${price4} where id=4;
      update public.product_variants set stock=100;
      delete from public.cart_items where cart_id='${CART_A}';
      insert into public.cart_items(id,cart_id,product_variant_id,quantity) values
        ('${I1}','${CART_A}',2,${quantity}),('${I3}','${CART_A}',17,1);`);
    const want = expected([
      { price: price1, rate: 15, offset: 1000, quantity },
      { price: price4, rate: 33, offset: 0, quantity: 1 },
    ]);
    const result = JSON.parse(place(db, { request, items: [I1, I3], total: want.total }));
    assert.equal(db.sql(`select concat_ws('|',subtotal_amount,discount_amount,shipping_fee,total_amount)
      from public.orders where id='${result.order_id}';`), `${want.subtotal}|${want.discount}|${want.shipping}|${want.total}`);
  });
});

test('rollback removes only empty marked order objects and preflight stays read-only', options, t => {
  const db = orders(t);
  place(db, { total: 25000 });
  db.reject(rollback(), /ORDER_ROLLBACK_NOT_EMPTY/);
  db.sql(`delete from public.order_payment_transactions; delete from public.order_status_histories;
    delete from public.order_items; delete from public.orders;`);
  db.sql(rollback());
  assert.equal(db.sql(`select count(*) from pg_class where relname in
    ('orders','order_items','order_status_histories','order_payment_transactions');`), '0');
  assert.equal(db.sql(`select to_regprocedure('public.place_order(uuid,uuid,uuid[],uuid,text,integer)') is null
    and to_regtype('public.order_status') is null;`), 't');
  db.sql(migration());
  // First row: database name, server version, transaction_read_only.
  assert.match(db.sql(preflight()).split('\n')[0], /^[^|]+\|[^|]+\|on$/);
  db.reject(migration(), /ORDER_MIGRATION_OBJECT_EXISTS/);
});
