import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { test } from 'node:test';
import * as React from 'react';
import { loadTs } from './helpers/load-ts.mjs';

function createCart() {
  return loadTs('src/domains/cart/cart.store.ts').useCartStore;
}

function reconcile(store, requested, available) {
  assert.equal(typeof store.getState().reconcileItems, 'function');
  return store.getState().reconcileItems(requested, available);
}

test('reconciliation removes unavailable pairs and their selections in one update, preserving remaining quantities and selections', () => {
  const store = createCart();
  store.getState().addToCart(1, 2, 3);
  store.getState().addToCart(2, 7, 2);
  store.getState().toggleSelected(7, false);
  const requested = store.getState().items;
  const changes = [];
  store.subscribe(state => changes.push({ items: state.items, selectedIds: state.selectedIds }));

  assert.equal(reconcile(store, requested, [{ productId: 2, variantId: 7 }]), 1);
  assert.deepEqual(changes, [{ items: [{ productId: 2, variantId: 7, quantity: 2 }], selectedIds: [] }]);
});

test('an empty successful result clears all items, selections and the badge count', () => {
  const store = createCart();
  const { getCartItemCount } = loadTs('src/domains/cart/cart.domain.ts');
  store.getState().addToCart(1, 2, 3);
  assert.equal(reconcile(store, store.getState().items, []), 1);
  assert.deepEqual(store.getState().items, []);
  assert.deepEqual(store.getState().selectedIds, []);
  assert.equal(getCartItemCount(store.getState().items), 0);
});

test('matching a variant from another product cannot keep an invalid cart pair', () => {
  const store = createCart();
  store.getState().addToCart(1, 2);
  assert.equal(reconcile(store, store.getState().items, [{ productId: 9, variantId: 2 }]), 1);
  assert.deepEqual(store.getState().items, []);
});

test('unchanged responses preserve state identity and do not trigger repeat subscriptions', () => {
  const store = createCart();
  store.getState().addToCart(1, 2, 3);
  const original = store.getState();
  let notifications = 0;
  store.subscribe(() => notifications++);
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.equal(reconcile(store, original.items, [{ productId: 1, variantId: 2 }]), 0);
    assert.equal(store.getState(), original);
  }
  assert.equal(notifications, 0);
});

test('a stale snapshot cannot delete additions, changed options, quantities or a re-added pair', () => {
  const changes = [
    store => store.getState().addToCart(2, 7),
    store => store.getState().updateOption(2, 2, 7),
    store => store.getState().updateQuantity(2, 4),
    store => { store.getState().removeFromCart(2); store.getState().addToCart(1, 2); },
  ];
  for (const change of changes) {
    const store = createCart();
    store.getState().addToCart(1, 2);
    const requested = store.getState().items;
    change(store);
    const current = store.getState();
    assert.equal(reconcile(store, requested, []), 0);
    assert.equal(store.getState(), current);
  }
});

function elements(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(elements);
  return [node, ...elements(node.props?.children)];
}

// Run the real page and Zustand store; control React lifecycle and HTTP responses
// without adding a DOM dependency or contacting Supabase.
function mountCart(t, seed) {
  const store = createCart();
  seed(store.getState());
  const slots = [];
  const pendingEffects = [];
  const requests = [];
  const notices = [];
  let cursor = 0;
  let dirty = true;
  let tree;
  const changed = (previous, next) => !previous || previous.some((value, index) => !Object.is(value, next[index]));
  const memo = (factory, deps) => {
    const index = cursor++;
    if (changed(slots[index]?.deps, deps)) slots[index] = { deps, value: factory() };
    return slots[index].value;
  };
  const hooks = {
    ...React,
    useMemo: memo,
    useCallback: (fn, deps) => memo(() => fn, deps),
    useState: initial => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, next => {
        const value = typeof next === 'function' ? next(slots[index].value) : next;
        if (!Object.is(value, slots[index].value)) { slots[index].value = value; dirty = true; }
      }];
    },
    useEffect: (effect, deps) => {
      const index = cursor++;
      if (changed(slots[index]?.deps, deps)) {
        pendingEffects.push(() => {
          slots[index]?.cleanup?.();
          slots[index] = { deps, cleanup: effect() };
        });
      }
    },
  };
  const useStore = Object.assign(() => store.getState(), { getState: store.getState });
  const { CartPageClient } = loadTs('src/features/cart/cart-page-client.tsx', {
    react: hooks,
    '@/domains/cart': { useCartStore: useStore },
    sonner: { toast: { info: message => notices.push(message) } },
  });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (url, options) => new Promise((resolve, reject) => requests.push({ url, options, resolve, reject }));
  const unsubscribe = store.subscribe(() => { dirty = true; });
  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const slot of slots) slot.cleanup?.();
    unsubscribe();
    globalThis.fetch = originalFetch;
  };
  t.after(dispose);
  const flush = () => {
    for (let count = 0; dirty; count++) {
      assert.ok(count < 15, 'cart rendering must settle without a request loop');
      dirty = false;
      cursor = 0;
      tree = CartPageClient();
      for (const effect of pendingEffects.splice(0)) effect();
    }
  };
  flush();
  return {
    store, requests, notices, flush, dispose,
    nodes: () => elements(tree),
    async settle() { await setImmediate(); flush(); },
  };
}

const product = (productId, variantId, overrides = {}) => ({
  productId, variantId, styleId: 1, name: `상품 ${productId}`, color: '그레이',
  thumbnailUrl: '/file.svg', price: 10000, discountRate: 0, stock: 10, size: 'M',
  priceOffset: 0, ...overrides,
});
const response = cartItems => Response.json({ cartItems, optionGroups: {} });

test('a successful empty page response clears hidden items and shows the empty-cart state with one notice', async t => {
  const page = mountCart(t, cart => cart.addToCart(1, 2));
  page.requests[0].resolve(response([]));
  await page.settle();
  assert.deepEqual(page.store.getState().items, []);
  assert.deepEqual(page.store.getState().selectedIds, []);
  assert.ok(page.nodes().some(node => node.props?.isEmpty === true));
  assert.equal(page.notices.length, 1);
  assert.equal(page.requests.length, 1);
});

test('partial cleanup preserves sold-out rows and quantities and settles after one follow-up query', async t => {
  const page = mountCart(t, cart => { cart.addToCart(1, 2, 3); cart.addToCart(2, 7); });
  const soldOut = product(1, 2, { stock: 0 });
  page.requests[0].resolve(response([soldOut]));
  await page.settle();
  assert.deepEqual(page.store.getState().items, [{ productId: 1, variantId: 2, quantity: 3 }]);
  assert.deepEqual(page.store.getState().selectedIds, [2]);
  assert.equal(page.notices.length, 1);
  assert.equal(page.requests.length, 2);
  page.requests[1].resolve(response([soldOut]));
  await page.settle();
  assert.equal(page.requests.length, 2);
  assert.equal(page.notices.length, 1);
  const summary = page.nodes().find(node => node.props?.selectedProducts);
  assert.equal(summary.props.selectedProducts[0].stock, 0);
  assert.equal(summary.props.selectedProducts[0].quantity, 3);
});

test('HTTP, network and JSON failures preserve cart state and provide a working retry', async t => {
  const failures = [
    request => request.resolve(new Response(null, { status: 500 })),
    request => request.reject(new Error('NETWORK_FAILURE')),
    request => request.resolve(new Response('invalid json', { status: 200 })),
  ];
  for (const fail of failures) {
    const page = mountCart(t, cart => cart.addToCart(1, 2, 2));
    const before = page.store.getState();
    fail(page.requests[0]);
    await page.settle();
    assert.equal(page.store.getState(), before);
    assert.equal(page.notices.length, 0);
    assert.ok(page.nodes().some(node => node.props?.role === 'alert'));
    page.nodes().find(node => node.props?.children === '다시 시도').props.onClick();
    page.flush();
    assert.equal(page.requests.length, 2);
    page.requests[1].resolve(response([product(1, 2)]));
    await page.settle();
    assert.ok(!page.nodes().some(node => node.props?.role === 'alert'));
    assert.equal(page.store.getState(), before);
    page.dispose();
  }
});

test('an old success arriving before effect cleanup cannot delete a newly added item', async t => {
  const page = mountCart(t, cart => cart.addToCart(1, 2));
  page.store.getState().addToCart(2, 7);
  page.requests[0].resolve(response([]));
  await page.settle();
  assert.equal(page.store.getState().items.length, 2);
  assert.equal(page.notices.length, 0);
  assert.equal(page.requests.length, 2);
  page.requests[1].resolve(response([product(1, 2), product(2, 7)]));
  await page.settle();
  assert.equal(page.store.getState().items.length, 2);
});

test('aborted old success and failure responses cannot overwrite newer product or loading state', async t => {
  for (const failOld of [false, true]) {
    const page = mountCart(t, cart => cart.addToCart(1, 2));
    page.store.getState().updateQuantity(2, 4);
    page.flush();
    assert.equal(page.requests[0].options.signal?.aborted, true);
    if (failOld) page.requests[0].reject(new Error('OLD_FAILURE'));
    else page.requests[0].resolve(response([]));
    await page.settle();
    assert.ok(page.nodes().some(node => node.props?.children === '장바구니 상품을 불러오는 중입니다.'));
    assert.ok(!page.nodes().some(node => node.props?.role === 'alert'));
    page.requests[1].resolve(response([product(1, 2)]));
    await page.settle();
    assert.equal(page.store.getState().items[0].quantity, 4);
    assert.equal(page.notices.length, 0);
    page.dispose();
  }
});

test('leaving the page aborts its request and a late result cannot clear cart items', async t => {
  const page = mountCart(t, cart => cart.addToCart(1, 2));
  page.dispose();
  assert.equal(page.requests[0].options.signal?.aborted, true);
  page.requests[0].resolve(response([]));
  await setImmediate();
  assert.equal(page.store.getState().items.length, 1);
  assert.equal(page.notices.length, 0);
});
