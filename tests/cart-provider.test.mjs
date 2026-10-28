import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import React from 'react';
import * as Zustand from 'zustand';
import { renderToString } from 'react-dom/server';
import { loadTs } from './helpers/load-ts.mjs';
import { A, B, I1, CART_A, CART_B, cartView } from './helpers/cart-fixtures.mjs';

const member = userId => ({ status: 'member', userId });
const guest = { status: 'guest' };
const ok = cart => ({ status: 'ok', cart });
const child = React.createElement('main', null, '상품 탐색');
const mountedViews = new WeakMap();
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
  let raw = JSON.stringify({ version: 2, items });
  const storage = { getItem: () => raw, setItem: (_, next) => { raw = next; } };
  replaceGlobal(t, 'localStorage', { value: storage });
  return { document: () => JSON.parse(raw) };
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
  const pending = []; const layout = []; const subscriptions = []; const observations = [];
  const notices = []; const refreshes = [];
  let touched = new Set();
  let current; let cursor = 0; let dirty = false; let pathname = path; let rootProps = props;
  function effectHook(queue, effect, deps) {
    const instance = current; const index = cursor++;
    if (different(instance.slots[index]?.deps, deps)) queue.push(() => {
      instance.slots[index]?.cleanup?.();
      instance.slots[index] = { deps, effect, cleanup: effect() };
    });
  }
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
    // Layout effects run first in a commit, as in React.
    useLayoutEffect: (effect, deps) => effectHook(layout, effect, deps),
    useEffect: (effect, deps) => effectHook(pending, effect, deps),
    // Resubscribes when the store changes, as React does.
    useSyncExternalStore: (subscribe, getSnapshot) => {
      const index = cursor++;
      const slot = current.slots[index];
      if (slot?.subscribe !== subscribe) {
        slot?.unsubscribe();
        const unsubscribe = subscribe(() => { dirty = true; }); subscriptions.push(unsubscribe);
        current.slots[index] = { subscribe, unsubscribe };
      }
      return getSnapshot();
    },
  };
  const router = { refresh: () => { refreshes.push(rootProps.access); } };
  const mocks = { react, 'next/navigation': { usePathname: () => pathname, useRouter: () => router }, sonner: { toast: { info: message => notices.push(['info', message]), error: message => notices.push(['error', message]) } },
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
      // A new key is a new instance, as in React.
      const at = node.key == null ? location : `${location}#${node.key}`;
      touched.add(at);
      if (!instances.has(at)) instances.set(at, { slots: [] });
      const previous = current; const previousCursor = cursor; current = instances.get(at); cursor = 0;
      const result = node.type(node.props); current = previous; cursor = previousCursor;
      return renderNode(result, `${at}.child`);
    }
    return { ...node, props: { ...node.props, children: renderNode(node.props?.children, `${location}.children`) } };
  }
  function render(next = {}) {
    rootProps = { ...rootProps, ...next }; touched = new Set();
    tree = renderNode(React.createElement(provider.CartProvider, rootProps), 'root');
    // Instances left out of this render unmount on commit: their effect cleanups run.
    for (const [at, instance] of instances) if (!touched.has(at)) layout.push(() => {
      if (instances.get(at) !== instance) return;
      for (const slot of instance.slots) slot?.cleanup?.();
      instances.delete(at);
    });
    dirty = false; return tree;
  }
  function commitLayout() { for (const effect of layout.splice(0)) effect(); }
  function commit() { commitLayout(); for (const effect of pending.splice(0)) effect(); }
  function flush() {
    for (let n = 0; layout.length || pending.length || dirty; n++) { assert.ok(n < 20, 'Provider render must settle'); if (dirty) render(); commit(); }
  }
  let disposed = false;
  function dispose() { if (disposed) return; disposed = true; for (const instance of instances.values()) for (const slot of instance.slots) slot.cleanup?.(); subscriptions.forEach(fn => fn()); }
  if (!mountedViews.has(t)) mountedViews.set(t, []);
  mountedViews.get(t).push(dispose);
  t.after(dispose);
  render();
  return { render, commit, commitLayout, flush, dispose, observations, notices, refreshes, latest: () => observations.at(-1), tree: () => tree,
    path: value => { pathname = value; render(); },
    // A concurrent render React throws away: hooks and effects fall back to the committed tree.
    abandon(next) {
      const saved = [...instances].map(([key, instance]) => [key, instance.slots.map(slot => slot && { ...slot })]);
      const savedProps = rootProps; const queued = [pending.length, layout.length];
      render(next);
      pending.length = queued[0]; layout.length = queued[1]; rootProps = savedProps;
      instances.clear(); for (const [key, slots] of saved) instances.set(key, { slots });
    },
    restartEffects() {
      for (const instance of instances.values()) for (const slot of instance.slots) slot.cleanup?.();
      for (const instance of instances.values()) for (const slot of instance.slots) if (slot.effect) slot.cleanup = slot.effect();
    },
  };
}

test('server boundary passes only serializable access and children, never server function props', async () => {
  for (const access of [member(A), guest, { status: 'restricted' }, { status: 'error', message: 'Try again' }]) {
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


test('server rendering never accesses browser storage and retains children without cart reads', t => {
  for (const name of ['window', 'localStorage', 'navigator']) replaceGlobal(t, name, { get: () => { throw new Error(`SSR touched ${name}`); } });
  const { actions, calls } = actionBoundary();
  const { CartProvider } = loadTs('src/features/cart/cart-provider.tsx', { 'next/navigation': { usePathname: () => '/products', useRouter: () => ({ refresh() {} }) } });
  const html = renderToString(React.createElement(CartProvider, { access: member(A), actions }, child));
  assert.ok(html.includes('상품 탐색'));
  assert.equal(calls.resolve + calls.read.length + calls.mutate.length, 0);
});


test('an omitted actions prop keeps the HTTP port created at mount across re-renders', async t => {
  browser(t);
  const requests = [];
  replaceGlobal(t, 'fetch', { value: async (url, options) => {
    requests.push({ url, method: options.method, nextAction: options.headers?.['Next-Action'] });
    const body = ok(cartView({ owner: { kind: 'member', userId: A }, cartId: CART_A }));
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
  } });
  const view = mount(t, { access: member(A) }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.render({ access: member(A) }); view.flush();
  view.latest().commands.enterCart(); view.flush();
  await until(() => requests.filter(request => request.url === '/api/cart/read').length === 2, view.flush);
  assert.ok(requests.every(request => request.method === 'POST' && request.nextAction === undefined));
});

test('provider starts the controller with the server access and restarts on account change', async t => {
  browser(t);
  const { actions, calls } = actionBoundary();
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  assert.deepEqual(calls.read, [{ expectedUserId: A }]);
  view.render({ access: member(B) }); view.flush();
  await until(() => calls.read.length === 2 && !view.latest().snapshot.busy, view.flush);
  assert.deepEqual(calls.read[1], { expectedUserId: B });
  assert.deepEqual(view.latest().snapshot.cart.owner, { kind: 'member', userId: B });
});

test('an account change gives a fresh cart but keeps the page under it mounted', async t => {
  // Toasts, dialogs and form input below the cart must survive the switch.
  browser(t);
  const { actions, calls } = actionBoundary();
  let mounts = 0;
  const Consumer = (hooks, observations, react) => {
    const [mark] = react.useState(() => ++mounts);
    const snapshot = hooks.useCartState(state => state); const commands = hooks.useCartCommands();
    observations.push({ snapshot, commands, mark }); return React.createElement('output', null, snapshot.phase);
  };
  const view = mount(t, { access: member(A), actions }, { Consumer }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.render({ access: member(B) });
  assert.deepEqual([view.latest().snapshot.phase, view.latest().snapshot.cart], ['loading', null], 'A is never shown under B');
  view.flush();
  await until(() => calls.read.length === 2 && !view.latest().snapshot.busy, view.flush);
  assert.deepEqual(view.latest().snapshot.cart.owner, { kind: 'member', userId: B });
  assert.deepEqual([mounts, view.latest().mark], [1, 1]);
});

test('a new account never sees the previous cart before its start runs', async t => {
  browser(t);
  const { actions } = actionBoundary();
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready', view.flush);
  // Committed, but the start effect for B has not run yet.
  view.render({ access: member(B) }); view.commitLayout();
  const masked = view.latest();
  assert.deepEqual([masked.snapshot.phase, masked.snapshot.cart, masked.snapshot.access], ['loading', null, null]);
  assert.equal(masked.commands.adjustQuantity(I1, 1), false);
  assert.equal(masked.commands.addItems([{ productId: 1, variantId: 2, quantity: 1 }]), false);
});

test('an account change found by the cart asks the server to render the page, which starts a fresh cart for that account', async t => {
  browser(t);
  const { actions } = actionBoundary({ mutate: () => ({ status: 'access_changed', access: guest }) });
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  assert.equal(view.latest().commands.adjustQuantity(I1, 1), true); view.flush();
  await until(() => view.refreshes.length === 1, view.flush);
  assert.deepEqual([view.latest().snapshot.phase, view.latest().snapshot.cart], ['loading', null], 'A is hidden while the server renders');
  view.render({ access: guest }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  assert.deepEqual(view.latest().snapshot.cart.owner, { kind: 'guest' });
  assert.equal(view.refreshes.length, 1);
});

test('route changes make no cart request', async t => {
  browser(t);
  const { actions, calls } = actionBoundary();
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.path('/cart'); view.flush(); view.path('/products/1'); view.flush();
  await setImmediate();
  assert.equal(calls.read.length, 1);
  assert.equal(calls.resolve + calls.mutate.length, 0);
});

test('notify goes to toast info/error', async t => {
  browser(t);
  const { actions } = actionBoundary({ mutate: command => ok(cartView({ notices: [{ kind: 'sold_out', variantId: 2 }], operation: { requestId: command.requestId, outcome: 'rejected', itemIdMap: {}, notices: [] } })) });
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.latest().commands.addItems([{ productId: 1, variantId: 2, quantity: 1 }]); view.flush();
  await until(() => view.notices.length > 0, view.flush);
  assert.deepEqual(view.notices, [['info', '품절된 옵션은 새로 담거나 수량을 변경할 수 없습니다.']]);
});

const { selectCartItemCount, selectCartLocked } = loadTs('src/features/cart/cart-count.ts');
const base = { phase: 'ready', access: member(A), cart: cartView(), busy: false, pendingAdd: 0, selectedIds: [], message: null };

test('count shows cart quantity plus pending adds and is unknown only while loading', () => {
  assert.equal(selectCartItemCount(base), 2);
  assert.equal(selectCartItemCount({ ...base, pendingAdd: 3, busy: true }), 5);
  assert.equal(selectCartItemCount({ ...base, phase: 'error' }), 2);
  assert.equal(selectCartItemCount({ ...base, phase: 'loading', cart: null }), null);
  // Settled without a cart: no count to show, and nothing is being checked any more.
  assert.equal(selectCartItemCount({ ...base, phase: 'restricted', cart: null }), 0);
  assert.equal(selectCartItemCount({ ...base, phase: 'error', cart: null }), 0);
});

test('locked while busy, loading or restricted', () => {
  assert.equal(selectCartLocked(base), false);
  assert.equal(selectCartLocked({ ...base, busy: true }), true);
  assert.equal(selectCartLocked({ ...base, phase: 'loading' }), true);
  assert.equal(selectCartLocked({ ...base, phase: 'restricted' }), true);
});

test('locked when the first load failed and there is no cart', () => {
  assert.equal(selectCartLocked({ ...base, phase: 'error', cart: null }), true);
  assert.equal(selectCartLocked({ ...base, phase: 'error' }), false);
});

test('a guest cart entry that finds a login asks the server, then the member render starts that member', async t => {
  browser(t);
  const { actions, calls } = actionBoundary({ resolve: () => member(B) });
  const view = mount(t, { access: guest, actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.latest().commands.enterCart(); view.flush();
  await until(() => view.refreshes.length === 1, view.flush);
  assert.equal(calls.read.length, 0, 'B is not read before the server names B');
  view.render({ access: member(B) }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  assert.deepEqual(view.latest().snapshot.cart.owner, { kind: 'member', userId: B });
  assert.deepEqual(calls.read, [{ expectedUserId: B }]);
});

test('a cart still waiting for the server render after a few seconds reloads the page', async t => {
  // A navigation can replace the refresh and keep the root layout, so the new access never arrives.
  browser(t);
  let reloads = 0;
  replaceGlobal(t, 'location', { value: { reload: () => { reloads++; } } });
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { actions } = actionBoundary({ mutate: () => ({ status: 'access_changed', access: guest }) });
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.latest().commands.adjustQuantity(I1, 1); view.flush();
  await until(() => view.refreshes.length === 1, view.flush);
  t.mock.timers.tick(4999);
  assert.equal(reloads, 0);
  t.mock.timers.tick(1);
  assert.equal(reloads, 1);
});

for (const [name, next] of [['the same account (restart in place)', member(A)], ['another account (fresh cart)', guest]]) {
  test(`a server render for ${name} that arrives in time cancels the reload`, async t => {
    browser(t);
    let reloads = 0;
    replaceGlobal(t, 'location', { value: { reload: () => { reloads++; } } });
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { actions } = actionBoundary({ mutate: () => ({ status: 'access_changed', access: guest }) });
    const view = mount(t, { access: member(A), actions }); view.flush();
    await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
    view.latest().commands.adjustQuantity(I1, 1); view.flush();
    await until(() => view.refreshes.length === 1, view.flush);
    view.render({ access: next }); view.flush();
    t.mock.timers.tick(10_000);
    assert.equal(reloads, 0);
  });
}

test('a server render that still names the same account restarts a cart waiting for it', async t => {
  // Another tab logged out (access_changed), but by the time the server renders, A is logged in again.
  browser(t);
  const { actions, calls } = actionBoundary({ mutate: () => ({ status: 'access_changed', access: guest }) });
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.latest().commands.adjustQuantity(I1, 1); view.flush();
  await until(() => view.refreshes.length === 1, view.flush);
  view.render({ access: member(A) }); view.flush();
  await until(() => view.latest().snapshot.access?.status === 'member' && !view.latest().snapshot.busy, view.flush);
  assert.deepEqual(view.latest().snapshot.cart.owner, { kind: 'member', userId: A });
  assert.equal(calls.read.length, 2);
});

test('a same-account server render neither restarts nor hides the cart', async t => {
  browser(t);
  const { actions, calls } = actionBoundary();
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.render({ access: member(A) });
  assert.equal(view.latest().snapshot.phase, 'ready');
  assert.ok(view.latest().snapshot.cart);
  view.flush(); await setImmediate();
  assert.equal(calls.read.length, 1);
});

test('a remount (StrictMode effect replay) while the first read is pending still loads the cart', async t => {
  browser(t);
  let release; const first = new Promise(resolve => { release = resolve; });
  let reads = 0;
  const { actions } = actionBoundary({ read: input => (++reads === 1 ? first : Promise.resolve(ok(cartView({ owner: { kind: 'member', userId: input.expectedUserId } })))) });
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => reads === 1, view.flush);
  view.restartEffects(); view.flush();
  release(ok(cartView()));
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  assert.ok(view.latest().snapshot.cart);
});

test('a same-account server render does not re-enter the cart page', async t => {
  browser(t);
  const { actions, calls } = actionBoundary();
  const Consumer = (hooks, observations, react) => {
    const snapshot = hooks.useCartState(state => state); const commands = hooks.useCartCommands();
    react.useEffect(() => { commands.enterCart(); }, [commands.enterCart]);
    observations.push({ snapshot, commands }); return React.createElement('output', null, snapshot.phase);
  };
  const view = mount(t, { access: member(A), actions }, { Consumer }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.latest().commands.enterCart(); view.flush();
  await until(() => !view.latest().snapshot.busy, view.flush);
  const reads = calls.read.length;
  view.latest().commands.setSelected(I1, true); view.flush();
  view.render({ access: member(A) }); view.flush(); await setImmediate(); view.flush();
  assert.equal(calls.read.length, reads);
  assert.deepEqual(view.latest().snapshot.selectedIds, [I1]);
});

test('an abandoned render for another account leaves commands working for the committed one', async t => {
  browser(t);
  const { actions, calls } = actionBoundary();
  const view = mount(t, { access: member(A), actions }); view.flush();
  await until(() => view.latest().snapshot.phase === 'ready' && !view.latest().snapshot.busy, view.flush);
  view.abandon({ access: member(B) });
  view.render(); view.flush();
  assert.equal(view.latest().commands.adjustQuantity(I1, 1), true);
  assert.equal(calls.mutate.length, 1);
});
