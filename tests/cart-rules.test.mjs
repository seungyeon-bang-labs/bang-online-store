import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, I1, I2, REQUEST1, cartDto, cartView, command } from './helpers/cart-fixtures.mjs';

const rules = () => loadTs('src/domains/cart/cart.rules.ts');
const schemas = () => loadTs('src/domains/cart/cart.schema.ts');
const add = items => command({ operation: { kind: 'add_items', items } });

test('positive stock caps but zero preserves', () => {
  const { getAdjustedQuantity } = rules();
  assert.equal(getAdjustedQuantity(5, 2), 2);
  assert.equal(getAdjustedQuantity(2, 5), 2);
  assert.equal(getAdjustedQuantity(5, 0), 5);
});

test('no automatic selection and existing purchasable selection survives', () => {
  const { reconcileSelection } = rules();
  const items = Object.freeze(cartView().items.map(Object.freeze));
  assert.deepEqual(reconcileSelection([], items), []);
  const selected = Object.freeze([I1, I1, I2]);
  assert.deepEqual(reconcileSelection(selected, items), [I1]);
  assert.deepEqual(selected, [I1, I1, I2]);
  assert.deepEqual(reconcileSelection([I1], [{ ...items[0], stock: 0, canSelect: false }]), []);
  assert.deepEqual(reconcileSelection([], items), []); // restocking does not reselect
});

test('option move preserves either selection once and never selects an unavailable target', () => {
  const { reconcileSelection } = rules();
  const target = { ...cartView().items[0], id: I2, variantId: 17 };
  const mapping = Object.freeze({ [I1]: I2 });
  assert.deepEqual(reconcileSelection([I1], [target], mapping), [I2]);
  assert.deepEqual(reconcileSelection([I2], [target], mapping), [I2]);
  assert.deepEqual(reconcileSelection([I1, I2], [target], mapping), [I2]);
  assert.deepEqual(reconcileSelection([], [target], mapping), []);
  assert.deepEqual(reconcileSelection([I1], [{ ...target, canSelect: false }], mapping), []);
});

test('all supported commands retain their original fixed request content', () => {
  const { cartCommandSchema } = schemas();
  const operations = [
    { kind: 'merge_guest', items: [{ productId: 1, variantId: 2, quantity: 2 }] },
    { kind: 'add_items', items: [{ productId: 1, variantId: 2, quantity: 2 }] },
    { kind: 'adjust_quantity', itemId: I1, delta: 1 },
    { kind: 'adjust_quantity', itemId: I1, delta: -1 },
    { kind: 'change_option', itemId: I1, productId: 4, variantId: 17 },
    { kind: 'remove_items', itemIds: [I2, I1] },
  ];
  for (const operation of operations) {
    const input = command({ operation });
    const before = structuredClone(input);
    assert.deepEqual(cartCommandSchema.parse(input), before);
    assert.deepEqual(input, before);
  }
});

test('numeric IDs and safe quantities reject malformed values without coercion', () => {
  const { cartCommandSchema } = schemas();
  for (const invalid of ['2', 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity, null]) {
    for (const field of ['productId', 'variantId']) {
      const item = { productId: 1, variantId: 2, quantity: 1, [field]: invalid };
      assert.equal(cartCommandSchema.safeParse(add([item])).success, false);
    }
  }
  for (const quantity of ['2', 0, -1, 1.5, 2147483648, Infinity, null]) {
    assert.equal(cartCommandSchema.safeParse(add([{ productId: 1, variantId: 2, quantity }])).success, false);
  }
  assert.equal(cartCommandSchema.safeParse(add([{ productId: 1, variantId: 2, quantity: 2147483647 }])).success, true);
  assert.equal(cartCommandSchema.safeParse(add([{
    productId: 9007199254740991, variantId: 9007199254740990, quantity: 1,
  }])).success, true);
});

test('commands reject invalid identity, version, delta and empty item lists', () => {
  const { cartCommandSchema, cartReadSchema } = schemas();
  for (const field of ['requestId', 'expectedUserId']) {
    assert.equal(cartCommandSchema.safeParse(command({ [field]: 'not-a-uuid' })).success, false);
  }
  assert.equal(cartCommandSchema.safeParse(command({ version: 2 })).success, false);
  for (const delta of [0, 2, -2, 1.5, '1']) {
    assert.equal(cartCommandSchema.safeParse(command({ operation: { kind: 'adjust_quantity', itemId: I1, delta } })).success, false);
  }
  for (const operation of [
    { kind: 'adjust_quantity', itemId: 2, delta: 1 },
    { kind: 'change_option', itemId: I1, productId: 4, variantId: '17' },
    { kind: 'remove_items', itemIds: [] },
    { kind: 'remove_items', itemIds: [2] },
    { kind: 'merge_guest', items: [] },
    { kind: 'add_items', items: [] },
    { kind: 'replace_all', items: [] },
  ]) assert.equal(cartCommandSchema.safeParse(command({ operation })).success, false);
  assert.deepEqual(cartReadSchema.parse({ expectedUserId: A }), { expectedUserId: A });
  assert.equal(cartReadSchema.safeParse({ expectedUserId: 'another-user' }).success, false);
});

test('duplicate option sums cannot overflow the storage quantity before stock adjustment', () => {
  const { cartCommandSchema } = schemas();
  const items = [
    { productId: 1, variantId: 2, quantity: 2147483647 },
    { productId: 1, variantId: 2, quantity: 1 },
  ];
  for (const kind of ['add_items', 'merge_guest']) {
    assert.equal(cartCommandSchema.safeParse(command({ operation: { kind, items } })).success, false);
  }
  const valid = add([{ ...items[0], quantity: 2 }, { ...items[1], quantity: 3 }]);
  assert.deepEqual(cartCommandSchema.parse(valid), valid);
  assert.equal(cartCommandSchema.safeParse(add([
    items[0], { productId: 2, variantId: 7, quantity: 1 },
  ])).success, true);
});

test('revision stays exact across the JavaScript safe integer boundary', () => {
  const { parseCartSnapshot } = schemas();
  for (const revision of ['0', '9007199254740993', '9223372036854775807']) {
    assert.equal(parseCartSnapshot(cartDto({ revision })).revision, revision);
  }
  assert.ok(BigInt(parseCartSnapshot(cartDto({ revision: '9007199254740993' })).revision) > BigInt('9007199254740992'));
  for (const revision of [1, null, '-1', '1.5', '1e3', '01', '', '9223372036854775808']) {
    assert.throws(() => parseCartSnapshot(cartDto({ revision })));
  }
});

test('member snapshots accept empty carts and completed business rejections', () => {
  const { parseCartSnapshot } = schemas();
  const snapshot = cartDto({
    items: [],
    notices: [{ kind: 'sold_out', variantId: 7 }],
    operation: {
      requestId: REQUEST1, outcome: 'rejected', itemIdMap: {},
      notices: [{ kind: 'item_missing', itemId: I1 }],
    },
  });
  assert.deepEqual(parseCartSnapshot(snapshot), snapshot);
});

test('member snapshot validation rejects malformed ownership, lines and receipts', () => {
  const { parseCartSnapshot } = schemas();
  for (const overrides of [
    { owner_id: null }, { owner_id: 'guest' }, { cart_id: null },
    { items: [{ ...cartDto().items[0], quantity: 0 }] },
    { items: [{ ...cartDto().items[0], product_variant_id: '2' }] },
    { notices: [{ kind: 'unknown' }] },
    { operation: { requestId: 'bad', outcome: 'applied', itemIdMap: {}, notices: [] } },
    { operation: { requestId: REQUEST1, outcome: 'unknown', itemIdMap: {}, notices: [] } },
    { operation: { requestId: REQUEST1, outcome: 'applied', itemIdMap: { [I1]: 2 }, notices: [] } },
  ]) assert.throws(() => parseCartSnapshot(cartDto(overrides)));
});
