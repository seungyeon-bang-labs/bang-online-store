import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { I1, I2 } from './helpers/cart-fixtures.mjs';

const KEY = 'bang-cart:v2';
const M1 = '40000000-0000-4000-8000-000000000001';
const M2 = '40000000-0000-4000-8000-000000000002';
const line = (overrides = {}) => ({ id: I1, productId: 1, variantId: 2, quantity: 1, ...overrides });

function memory(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { data, storage: { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => { data.set(key, value); } } };
}
const adapter = storage => loadTs('src/domains/cart/cart.local.ts').createCartLocalAdapter({ storage });

test('empty or malformed storage reads as an empty v2 document', () => {
  for (const raw of [undefined, '{', JSON.stringify({ version: 1, authEpoch: 0, guest: { revision: 0, items: [] }, pendingByAccount: {} })]) {
    const { storage } = memory(raw === undefined ? {} : { [KEY]: raw });
    assert.deepEqual(adapter(storage).read(), { version: 2, items: [] });
  }
  const { storage } = memory({ 'bang-cart:v1': JSON.stringify({ version: 1 }) });
  assert.deepEqual(adapter(storage).read(), { version: 2, items: [] }, 'v1 is never read');
});

test('write replaces items and clears mergeId', () => {
  const { storage, data } = memory({ [KEY]: JSON.stringify({ version: 2, items: [line()], mergeId: M1 }) });
  const local = adapter(storage);
  local.write([line({ id: I2, quantity: 3 })]);
  assert.deepEqual(local.read(), { version: 2, items: [line({ id: I2, quantity: 3 })] });
  assert.equal(JSON.parse(data.get(KEY)).mergeId, undefined);
});

test('ensureMergeId creates once and reuses', () => {
  const { storage } = memory();
  const local = adapter(storage);
  local.write([line()]);
  let calls = 0;
  const newId = () => { calls++; return calls === 1 ? M1 : M2; };
  assert.equal(local.ensureMergeId(newId), M1);
  assert.equal(local.ensureMergeId(newId), M1);
  assert.equal(calls, 1);
  assert.deepEqual(local.read(), { version: 2, items: [line()], mergeId: M1 });
});

test('clearIfMergeId empties only when the id still matches', () => {
  const { storage } = memory();
  const local = adapter(storage);
  local.write([line()]);
  const id = local.ensureMergeId(() => M1);
  assert.equal(local.clearIfMergeId(id), true);
  assert.deepEqual(local.read(), { version: 2, items: [] });
  local.write([line()]);
  local.ensureMergeId(() => M2);
  local.write([line({ quantity: 2 })]);
  assert.equal(local.clearIfMergeId(M2), false);
  assert.deepEqual(local.read().items, [line({ quantity: 2 })]);
});

test('missing storage throws CART_LOCAL_UNAVAILABLE', () => {
  const local = adapter(null);
  assert.throws(() => local.read(), /CART_LOCAL_UNAVAILABLE/);
  assert.throws(() => local.write([]), /CART_LOCAL_UNAVAILABLE/);
});

test('write rejects invalid lines', () => {
  const { storage, data } = memory();
  const local = adapter(storage);
  assert.throws(() => local.write([line({ quantity: 0 })]));
  assert.throws(() => local.write([line(), line()]), 'duplicate line IDs');
  assert.equal(data.has(KEY), false);
});
