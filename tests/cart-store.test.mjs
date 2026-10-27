import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, B, I1, I2, REQUEST1 as R1, cartView } from './helpers/cart-fixtures.mjs';

test('cart store factories isolate access, cart and selection', () => {
  const { createCartStore } = loadTs('src/domains/cart/cart.store.ts');
  const first = createCartStore(); const second = createCartStore();
  assert.equal(first.getState().phase, 'checking');
  assert.equal(first.getState().cart, null);
  first.getState().setStateFromController({ phase: 'ready', access: { status: 'member', userId: A }, cart: cartView() });
  first.getState().setSelected(I1, true);
  assert.deepEqual(first.getState().selectedIds, [I1]);
  assert.deepEqual(second.getState().selectedIds, []);
  assert.equal(second.getState().access, null);
});

test('selection is manual, ready-only and limited to currently purchasable IDs', () => {
  const store = loadTs('src/domains/cart/cart.store.ts').createCartStore();
  const cart = cartView({ items: [...cartView().items, { ...cartView().items[0], id: I2, stock: 0, canSelect: false }] });
  store.getState().setStateFromController({ phase: 'ready', cart });
  assert.deepEqual(store.getState().selectedIds, []);
  store.getState().setSelected(I2, true);
  store.getState().selectAll(true);
  assert.deepEqual(store.getState().selectedIds, [I1]);
  store.getState().selectAll(false);
  assert.deepEqual(store.getState().selectedIds, []);
  store.getState().setStateFromController({ phase: 'mutating' });
  store.getState().setSelected(I1, true);
  assert.deepEqual(store.getState().selectedIds, []);
});

test('controller snapshots prune invalid selections without automatically selecting new lines', () => {
  const store = loadTs('src/domains/cart/cart.store.ts').createCartStore();
  store.getState().setStateFromController({ phase: 'ready', cart: cartView() });
  store.getState().setSelected(I1, true);
  store.getState().setStateFromController({ cart: cartView({ items: [{ ...cartView().items[0], id: I2 }] }) });
  assert.deepEqual(store.getState().selectedIds, []);
  store.getState().setStateFromController({ selectedIds: [I2, I2, 'missing'] });
  assert.deepEqual(store.getState().selectedIds, [I2]);
});

test('settled results survive a hidden cart and an unknown account, and clear only with a different owner', () => {
  const store = loadTs('src/domains/cart/cart.store.ts').createCartStore();
  const result = { requestId: R1, outcome: 'applied', itemIdMap: {}, notices: [] };
  store.getState().setStateFromController({ access: { status: 'member', userId: A }, settledRequests: { [R1]: result } });
  store.getState().setStateFromController({ cart: null, access: null, phase: 'checking' });
  store.getState().setStateFromController({ access: { status: 'error', message: 'x' } });
  store.getState().setStateFromController({ access: { status: 'restricted', reason: 'unverified' } }); // access, not identity
  store.getState().setStateFromController({ access: { status: 'member', userId: A } });
  assert.deepEqual(store.getState().settledRequests, { [R1]: result });
  store.getState().setStateFromController({ access: { status: 'guest' } });
  assert.deepEqual(store.getState().settledRequests, {}); // member A → guest is a real identity change
  store.getState().setStateFromController({ access: { status: 'member', userId: A }, settledRequests: { [R1]: result } });
  assert.deepEqual(store.getState().settledRequests, { [R1]: result });
  store.getState().setStateFromController({ access: { status: 'member', userId: B } });
  assert.deepEqual(store.getState().settledRequests, {});
});

test('a new owner and the cleared results arrive in the same store update', () => {
  const store = loadTs('src/domains/cart/cart.store.ts').createCartStore();
  store.getState().setStateFromController({ access: { status: 'member', userId: A }, unresolved: true, heldCount: 2,
    settledRequests: { [R1]: { requestId: R1, outcome: 'applied', itemIdMap: {}, notices: [] } } });
  const seen = [];
  store.subscribe(state => seen.push([state.access?.userId, Object.keys(state.settledRequests).length, state.unresolved, state.heldCount]));
  store.getState().setStateFromController({ access: { status: 'member', userId: B } });
  assert.deepEqual(seen, [[B, 0, false, 0]]);
});
