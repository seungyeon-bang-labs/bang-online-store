import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import React from 'react';
import * as Zustand from 'zustand';
import { renderToString } from 'react-dom/server';
import { loadTs } from './helpers/load-ts.mjs';
import { A, B, I1, I2, CART_A, CART_B, cartView } from './helpers/cart-fixtures.mjs';

const member = userId => ({ status: 'member', userId });
const guest = { status: 'guest' };
const ok = cart => ({ status: 'ok', cart });
const child = React.createElement('main', null, '상품 탐색');
const mountedViews = new WeakMap();
function deferred() { let resolve; const promise = new Promise(yes => { resolve = yes; }); return { promise, resolve }; }
async function until(condition, flush = () => {}) {
  for (let n = 0; n < 150; n++) { flush(); if (condition()) return; await setImmediate(); }
  assert.fail('Expected asynchronous boundary was not reached');
}
function replaceGlobal(t, name, descriptor) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, ...descriptor });
  t.after(() => {
    for (const dispose of mountedViews.get(t) ?? []) dispose();
    if (original) Object.defineProperty(globalThis, name, original); else delete globalThis[name];
  });
}
function browser(t, items = []) {
  let raw = JSON.stringify({ version: 1, authEpoch: 0, guest: { revision: 0, items }, pendingByAccount: {} });
  let writes = 0; let reads = 0; let fail = false; let tail = Promise.resolve();
  const listeners = new Set();
  const storage = {
    getItem: () => { reads++; if (fail) throw new Error('Storage blocked'); return raw; },
    setItem: (_, next) => { if (fail) throw new Error('Storage blocked'); writes++; raw = next; },
  };
  replaceGlobal(t, 'localStorage', { value: storage });
  replaceGlobal(t, 'navigator', { value: { locks: { request: (_, work) => { const job = tail.then(work); tail = job.catch(() => {}); return job; } } } });
  replaceGlobal(t, 'window', { value: {
    addEventListener: (name, listener) => { assert.equal(name, 'storage'); listeners.add(listener); },
    removeEventListener: (name, listener) => { assert.equal(name, 'storage'); listeners.delete(listener); },
  } });
  return { document: () => JSON.parse(raw), writes: () => writes, reads: () => reads, listeners,
    fail: next => { fail = next; } };
}
function actionBoundary({ resolve, read, mutate } = {}) {
  const calls = { resolve: 0, read: [], mutate: [] };
  const actions = {
    resolveAccess: async () => { calls.resolve++; return resolve ? resolve() : member(A); },
    read: async input => { calls.read.push(input); return read ? read(input) : ok(cartView({
      owner: { kind: 'member', userId: input.expectedUserId }, cartId: input.expectedUserId === B ? CART_B : CART_A,
    })); },
    mutate: async command => { calls.mutate.push(structuredClone(command)); return mutate ? mutate(command) : ok(cartView({ revision: '2', operation: {
      requestId: command.requestId, outcome: 'applied', itemIdMap: {}, notices: [],
    } })); },
  };
  return { actions, calls };
}

// The existing TSX loader runs production Provider, hooks, Store, local adapter
// and controller. Only the React commit scheduler, pathname and Action/HTTP
// boundaries are controlled. This is not a DOM or browser lifecycle test.
function mount(t, props, { Consumer, path = '/products' } = {}) {
  const instances = new Map(); const contexts = new Map(); const providers = new Map();
  const pending = []; const subscriptions = []; const observations = [];
  const notices = [];
  let current; let cursor = 0; let dirty = false; let pathname = path; let rootProps = props;
  const different = (left, right) => !left || !right || left.length !== right.length || left.some((v, i) => !Object.is(v, right[i]));
  const memo = (factory, deps) => {
    const index = cursor++;
    if (different(current.slots[index]?.deps, deps)) current.slots[index] = { deps, value: factory() };
    return current.slots[index].value;
  };
  const react = { ...React,
    createContext: initial => { const context = React.createContext(initial); providers.set(context.Provider, context); return context; },
    useContext: context => contexts.has(context) ? contexts.get(context) : null,
    useMemo: memo,
    useCallback: (fn, deps) => memo(() => fn, deps),
    useState: initial => {
      const instance = current; const index = cursor++;
      if (!instance.slots[index]) instance.slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [instance.slots[index].value, next => { instance.slots[index].value = typeof next === 'function' ? next(instance.slots[index].value) : next; dirty = true; }];
    },
    useEffect: (effect, deps) => {
      const instance = current; const index = cursor++;
      if (different(instance.slots[index]?.deps, deps)) pending.push(() => {
        instance.slots[index]?.cleanup?.();
        instance.slots[index] = { deps, effect, cleanup: effect() };
      });
    },
    useSyncExternalStore: (subscribe, getSnapshot) => {
      const index = cursor++;
      if (!current.slots[index]) { const unsubscribe = subscribe(() => { dirty = true; }); subscriptions.push(unsubscribe); current.slots[index] = {}; }
      return getSnapshot();
    },
  };
  const mocks = { react, 'next/navigation': { usePathname: () => pathname }, sonner: { toast: { info: message => notices.push(message) } },
    zustand: { ...Zustand, useStore: (store, selector) => react.useSyncExternalStore(store.subscribe, () => selector(store.getState()), () => selector(store.getInitialState())) } };
  const provider = loadTs('src/features/cart/cart-provider.tsx', mocks);
  const hooks = loadTs('src/features/cart/use-cart.ts', { ...mocks, './cart-provider': provider });
  function DefaultConsumer() { const snapshot = hooks.useCartState(state => state); const commands = hooks.useCartCommands(); observations.push({ snapshot, commands }); return React.createElement('output', null, snapshot.phase); }
  const Component = Consumer ? () => Consumer(hooks, observations, react) : DefaultConsumer;
  rootProps = { ...rootProps, children: React.createElement(Component) };
  let tree;
  function renderNode(node, location) {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map((item, i) => renderNode(item, `${location}.${i}`));
    if (providers.has(node.type)) {
      const context = providers.get(node.type); const previous = contexts.get(context);
      contexts.set(context, node.props.value);
      const result = renderNode(node.props.children, `${location}.context`);
      if (previous === undefined) contexts.delete(context); else contexts.set(context, previous);
      return result;
    }
    if (typeof node.type === 'function') {
      if (!instances.has(location)) instances.set(location, { slots: [] });
      const previous = current; const previousCursor = cursor; current = instances.get(location); cursor = 0;
      const result = node.type(node.props); current = previous; cursor = previousCursor;
      return renderNode(result, `${location}.child`);
    }
    return { ...node, props: { ...node.props, children: renderNode(node.props?.children, `${location}.children`) } };
  }
  function render(next = {}) { rootProps = { ...rootProps, ...next }; tree = renderNode(React.createElement(provider.CartProvider, rootProps), 'root'); dirty = false; return tree; }
  function commit() { for (const effect of pending.splice(0)) effect(); }
  function flush() {
    for (let n = 0; pending.length || dirty; n++) { assert.ok(n < 20, 'Provider render must settle'); if (dirty) render(); commit(); }
  }
  let disposed = false;
  function dispose() { if (disposed) return; disposed = true; for (const instance of instances.values()) for (const slot of instance.slots) slot.cleanup?.(); subscriptions.forEach(fn => fn()); }
  if (!mountedViews.has(t)) mountedViews.set(t, []);
  mountedViews.get(t).push(dispose);
  t.after(dispose);
  render();
  return { render, commit, flush, dispose, observations, notices, latest: () => observations.at(-1), tree: () => tree,
    path: value => { pathname = value; render(); },
    restartEffects() {
      for (const instance of instances.values()) for (const slot of instance.slots) slot.cleanup?.();
      for (const instance of instances.values()) for (const slot of instance.slots) if (slot.effect) slot.cleanup = slot.effect();
    },
  };
}

test('server boundary passes only serializable access and children, never server function props', async () => {
  for (const access of [member(A), guest, { status: 'restricted', reason: 'unverified' }, { status: 'error', message: 'Try again' }]) {
    const resolveCartAccess = async () => access; const readCart = async () => {}; const mutateCart = async () => {};
    const { CartBoundary } = loadTs('src/app/cart-boundary.tsx', {
      './cart-actions': { resolveCartAccess, readCart, mutateCart },
    });
    const tree = await CartBoundary({ children: child });
    assert.deepEqual(tree.props.access, access);
    assert.equal(tree.props.children, child);
    assert.deepEqual(Object.keys(tree.props).sort(), ['access', 'children']);
    assert.deepEqual(Object.keys(tree.props.access).sort(), Object.keys(access).sort());
  }
});

test('an omitted actions prop keeps the HTTP port created at mount across re-renders', async t => {
  browser(t);
  const requests = [];
  replaceGlobal(t, 'fetch', { value: async (url, options) => {
    requests.push({ url, method: options.method, nextAction: options.headers?.['Next-Action'] });
    const body = url === '/api/cart/access' ? member(A)
      : ok(cartView({ owner: { kind: 'member', userId: A }, cartId: CART_A }));
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const view = mount(t, { access: member(A) }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  view.render({ access: member(A) }); view.flush();
  view.path('/cart'); view.flush();
  await until(() => requests.some(request => request.url === '/api/cart/access'), view.flush);
  await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  assert.ok(requests.some(request => request.url === '/api/cart/read' && request.method === 'POST'));
  assert.ok(requests.every(request => request.nextAction === undefined));
});

test('server rendering never accesses browser storage and retains children without cart reads', t => {
  for (const name of ['window', 'localStorage', 'navigator']) replaceGlobal(t, name, { get: () => { throw new Error(`SSR touched ${name}`); } });
  const { actions, calls } = actionBoundary();
  const { CartProvider } = loadTs('src/features/cart/cart-provider.tsx', { 'next/navigation': { usePathname: () => '/products' } });
  const html = renderToString(React.createElement(CartProvider, { access: member(A), actions }, child));
  assert.ok(html.includes('상품 탐색'));
  assert.equal(calls.resolve + calls.read.length + calls.mutate.length, 0);
});

test('access changes mask the previous member before effects and preserve the consumer instance', async t => {
  browser(t); const { actions } = actionBoundary(); let childrenCreated = 0;
  const view = mount(t, { access: member(A), actions }, { Consumer: (hooks, observations, react) => {
    const [identity] = react.useState(() => { childrenCreated++; return {}; });
    observations.push({ snapshot: hooks.useCartState(s => s), commands: hooks.useCartCommands(), identity });
    return child;
  } });
  view.flush(); await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  assert.equal(view.latest().snapshot.cart.owner.userId, A);
  const identity = view.latest().identity;
  view.render({ access: member(B) });
  assert.equal(view.latest().snapshot.cart, null);
  assert.notEqual(view.latest().snapshot.phase, 'ready');
  assert.equal(view.latest().identity, identity);
  assert.equal(view.tree().type, 'main');
  assert.equal(childrenCreated, 1);
  assert.equal((await view.latest().commands.adjustQuantity(I1, 1)).status, 'retryable');
  view.flush(); await until(() => view.latest().snapshot.cart?.owner.userId === B, view.flush);
});

test('selection commands use the current provider only and never persist or call Actions', async t => {
  const env = browser(t);
  const { actions, calls } = actionBoundary({ read: () => ok(cartView({ items: [cartView().items[0], { ...cartView().items[0], id: I2, variantId: 7, stock: 0, canSelect: false }] })) });
  const first = mount(t, { access: member(A), actions }); const second = mount(t, { access: member(A), actions });
  first.flush(); second.flush(); await until(() => first.latest().snapshot.phase === 'ready' && second.latest().snapshot.phase === 'ready', () => { first.flush(); second.flush(); });
  const baseline = { writes: env.writes(), reads: env.reads(), server: calls.read.length + calls.mutate.length + calls.resolve };
  const commands = first.latest().commands;
  commands.setSelected(I1, true); first.flush(); assert.deepEqual(first.latest().snapshot.selectedIds, [I1]);
  commands.setSelected(I2, true); first.flush(); assert.deepEqual(first.latest().snapshot.selectedIds, [I1]);
  commands.selectAll(false); first.flush(); assert.deepEqual(first.latest().snapshot.selectedIds, []);
  commands.selectAll(true); first.flush(); assert.deepEqual(first.latest().snapshot.selectedIds, [I1]);
  assert.deepEqual(second.latest().snapshot.selectedIds, []);
  assert.deepEqual({ writes: env.writes(), reads: env.reads(), server: calls.read.length + calls.mutate.length + calls.resolve }, baseline);
  assert.equal('setStateFromController' in commands, false);
  assert.equal('setStateFromController' in first.latest().snapshot, false);
});

test('StrictMode-style cleanup and restart replays the same durable merge with one logical application', async t => {
  const env = browser(t, [{ id: I1, productId: 1, variantId: 2, quantity: 2 }]);
  const lost = deferred(); const receipts = new Map(); const applied = new Map();
  const { actions, calls } = actionBoundary({ mutate: command => {
    if (!receipts.has(command.requestId)) {
      applied.set(command.requestId, (applied.get(command.requestId) ?? 0) + 1);
      receipts.set(command.requestId, ok(cartView({ revision: '2', items: [{ ...cartView().items[0], quantity: 4 }], operation: {
        requestId: command.requestId, outcome: 'applied', itemIdMap: {}, notices: [],
      } })));
    }
    return calls.mutate.length === 1 ? lost.promise : receipts.get(command.requestId);
  } });
  const view = mount(t, { access: member(A), actions }); view.flush(); await until(() => calls.mutate.length === 1, view.flush);
  view.restartEffects(); await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  assert.equal(calls.mutate.length, 2); assert.deepEqual(calls.mutate[0], calls.mutate[1]);
  assert.equal(applied.get(calls.mutate[0].requestId), 1);
  assert.equal(view.latest().snapshot.cart.items[0].quantity, 4);
  lost.resolve(receipts.get(calls.mutate[0].requestId)); await setImmediate(); view.flush();
  assert.deepEqual(env.document().pendingByAccount, {}); assert.equal(env.listeners.size, 1);
  view.dispose(); assert.equal(env.listeners.size, 0);
});

test('pathname recheck and cart entry share one item read and preserve confirmed actual access', async t => {
  browser(t); let actual = member(A);
  const entering = deferred();
  const { actions, calls } = actionBoundary({ resolve: () => actual, read: input => calls.read.length === 2 ? entering.promise : ok(cartView({ owner: { kind: 'member', userId: input.expectedUserId }, cartId: input.expectedUserId === B ? CART_B : CART_A })) });
  const view = mount(t, { access: member(A), actions }); view.flush(); await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  const entry = view.latest().commands.enterCart(); await until(() => calls.read.length === 2);
  view.path('/cart'); view.flush();
  entering.resolve(ok(cartView())); await entry;
  await until(() => calls.resolve === 1 && view.latest().snapshot.phase === 'ready', view.flush);
  assert.equal(calls.read.length, 2);
  view.path('/products/1'); view.flush(); await until(() => calls.resolve === 2, view.flush);
  assert.equal(calls.read.length, 2);
  actual = member(B); await view.latest().commands.recheck('auth'); view.flush();
  assert.equal(view.latest().snapshot.cart.owner.userId, B);
  // Boundary props may still be A until the Server Component refresh arrives.
  assert.equal(view.latest().snapshot.phase, 'ready');
});

test('storage failure and error access lock the cart while the page child remains available', async t => {
  const env = browser(t); env.fail(true); const { actions, calls } = actionBoundary();
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'retryable', view.flush);
  assert.equal(view.tree().type, 'output'); assert.equal(view.latest().snapshot.cart, null);
  assert.equal(calls.read.length + calls.mutate.length, 0);
  env.fail(false); await view.latest().commands.retry(); view.flush();
  assert.equal(view.latest().snapshot.phase, 'ready');
  view.render({ access: { status: 'error', message: 'Access unavailable' } }); view.flush();
  await until(() => view.latest().snapshot.phase === 'retryable', view.flush);
  assert.equal(view.latest().snapshot.cart, null);
});

test('an earlier pathname callback cannot unlock an authentication transition', async t => {
  const env = browser(t); const entering = deferred();
  let actual = member(A);
  const { actions, calls } = actionBoundary({ resolve: () => actual, read: () => calls.read.length === 2 ? entering.promise : ok(cartView()) });
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  const entry = view.latest().commands.enterCart(); await until(() => calls.read.length === 2);
  view.path('/cart'); view.flush();
  view.latest().commands.beginAuthTransition();
  await until(() => env.document().authEpoch === 1, view.flush);
  entering.resolve(ok(cartView())); await entry;
  await setImmediate(); view.flush(); await setImmediate(); view.flush();
  assert.equal(calls.resolve, 0);
  assert.equal(view.latest().snapshot.phase, 'checking');
  assert.equal(view.latest().snapshot.cart, null);
  actual = guest;
  await view.latest().commands.recheck('auth'); view.flush();
  assert.equal(view.latest().snapshot.phase, 'ready');
  assert.equal(view.latest().snapshot.cart.owner.kind, 'guest');
});

test('an equivalent server snapshot keeps cart entry effects stable and preserves manual selection', async t => {
  browser(t); const { actions, calls } = actionBoundary();
  const view = mount(t, { access: member(A), actions }, { Consumer: (hooks, observations, react) => {
    const commands = hooks.useCartCommands();
    react.useEffect(() => { void commands.enterCart(); }, [commands.enterCart]);
    observations.push({ snapshot: hooks.useCartState(state => state), commands });
    return child;
  } });
  view.flush(); await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  view.latest().commands.setSelected(I1, true); view.flush();
  view.render({ access: member(A), actions: { ...actions } }); view.flush();
  await setImmediate(); view.flush();
  assert.equal(calls.read.length, 1);
  assert.deepEqual(view.latest().snapshot.selectedIds, [I1]);
});

test('public cart hooks reject consumers outside their provider', t => {
  browser(t);
  const { useCartState, useCartCommands } = loadTs('src/features/cart/use-cart.ts', { react: { ...React, useContext: () => null } });
  assert.throws(() => useCartState(state => state.phase), /CartProvider/);
  assert.throws(() => useCartCommands(), /CartProvider/);
});

test('confirmed adjustment notices appear outside the cart page once across effect replays', async t => {
  browser(t);
  const { actions } = actionBoundary({ read: () => ok(cartView({ notices: [{ kind: 'quantity_adjusted', itemId: I1, variantId: 2, before: 5, after: 2 }] })) });
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  assert.equal(view.notices.length, 1);
  assert.match(view.notices[0], /재고.*수량/);
  view.restartEffects(); await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  assert.equal(view.notices.length, 1);
});
