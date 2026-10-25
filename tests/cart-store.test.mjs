import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, I1, I2, cartView } from './helpers/cart-fixtures.mjs';

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
