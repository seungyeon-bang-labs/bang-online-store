import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, I1, I2, cartView } from './helpers/cart-fixtures.mjs';

const createStore = () => loadTs('src/domains/cart/store.ts').createCartStore();
const soldOut = () => ({ ...cartView().items[0], id: I2, variantId: 3, stock: 0, canSelect: false });

test('new store starts loading with nothing shown', () => {
  const s = createStore().getState();
  assert.deepEqual(
    { phase: s.phase, access: s.access, cart: s.cart, busy: s.busy, pendingAdd: s.pendingAdd, selectedIds: s.selectedIds, message: s.message },
    { phase: 'loading', access: null, cart: null, busy: false, pendingAdd: 0, selectedIds: [], message: null },
  );
});

test('selection works only in ready and only for purchasable items', () => {
  const store = createStore();
  store.getState().setStateFromController({ phase: 'ready', cart: cartView({ items: [...cartView().items, soldOut()] }) });
  store.getState().setSelected(I2, true);
  assert.deepEqual(store.getState().selectedIds, []);
  store.getState().selectAll(true);
  assert.deepEqual(store.getState().selectedIds, [I1]);
  store.getState().selectAll(false);
  store.getState().setStateFromController({ busy: true });
  store.getState().setSelected(I1, true);
  assert.deepEqual(store.getState().selectedIds, [I1], 'selection is screen-only, so busy does not block it');
  store.getState().selectAll(false);
  store.getState().setStateFromController({ phase: 'loading' });
  store.getState().setSelected(I1, true);
  assert.deepEqual(store.getState().selectedIds, []);
});

test('selection follows itemIdMap and drops items no longer in the cart', () => {
  const store = createStore();
  store.getState().setStateFromController({ phase: 'ready', cart: cartView() });
  store.getState().setSelected(I1, true);
  const moved = { ...cartView().items[0], id: I2 };
  store.getState().setStateFromController({ cart: cartView({ items: [moved], operation: { requestId: I1, outcome: 'applied', itemIdMap: { [I1]: I2 }, notices: [] } }) });
  assert.deepEqual(store.getState().selectedIds, [I2]);
  store.getState().setStateFromController({ cart: cartView({ items: [] }) });
  assert.deepEqual(store.getState().selectedIds, []);
});

test('stores are isolated', () => {
  const first = createStore(); const second = createStore();
  first.getState().setStateFromController({ phase: 'ready', access: { status: 'member', userId: A }, cart: cartView() });
  first.getState().setSelected(I1, true);
  assert.deepEqual(first.getState().selectedIds, [I1]);
  assert.deepEqual(second.getState().selectedIds, []);
  assert.equal(second.getState().access, null);
});
