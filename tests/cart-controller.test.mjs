import { productResponse } from './helpers/cart-products.mjs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { loadTs } from './helpers/load-ts.mjs';
import { A, B, I1, I2, CART_A, CART_B, cartView } from './helpers/cart-fixtures.mjs';

const member = userId => ({ status: 'member', userId });
const guest = { status: 'guest' };
const line = (overrides = {}) => ({ id: I1, productId: 1, variantId: 2, quantity: 2, ...overrides });
const ok = cart => ({ status: 'ok', cart });
const receipt = (command, outcome = 'applied', overrides = {}) => cartView({ revision: '2', operation: {
  requestId: command.requestId, outcome, itemIdMap: {}, notices: [],
}, ...overrides });
const product = (overrides = {}) => { const item = { ...cartView().items[0] }; delete item.id; delete item.quantity; delete item.canSelect; return { ...item, ...overrides }; };
const response = productResponse;
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function until(condition) { for (let i = 0; i < 100; i++) { if (condition()) return; await setImmediate(); } assert.fail('Expected asynchronous boundary was not reached'); }

function storageEnvironment() {
  let raw = null; let fail = false; let tail = Promise.resolve(); let sequence = 0;
  const listeners = new Set();
  const storage = { getItem: () => raw, setItem: (_, value) => { if (fail) throw new DOMException('Full', 'QuotaExceededError'); raw = value; } };
  const locks = { request: (_, callback) => { const result = tail.then(callback); tail = result.catch(() => {}); return result; } };
  const newId = () => `40000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
  const events = { subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); } };
  const { createCartLocalAdapter } = loadTs('src/domains/cart/cart.local.ts');
  return { local: createCartLocalAdapter({ storage, locks, events, newId }), newId,
    fail: value => { fail = value; }, raw: () => raw, emit: () => { for (const fn of listeners) fn({ key: 'bang-cart:v1', storageArea: storage }); } };
}

function setup({ env = storageEnvironment(), resolve, read, mutate, products } = {}) {
  const calls = { access: 0, read: [], mutate: [], products: [], signals: [] };
  const store = loadTs('src/domains/cart/cart.store.ts').createCartStore();
  const actions = {
    resolveAccess: async options => { calls.signals.push(options?.signal); calls.access++; return resolve ? resolve() : member(A); },
    read: async (input, options) => { calls.signals.push(options?.signal); calls.read.push(input); return read ? read(input, calls.read.length) : ok(cartView({ owner: { kind: 'member', userId: input.expectedUserId }, cartId: input.expectedUserId === B ? CART_B : CART_A })); },
    mutate: async (command, options) => { calls.signals.push(options?.signal); calls.mutate.push(structuredClone(command)); return mutate ? mutate(command, calls.mutate.length) : ok(receipt(command)); },
  };
  const loadProducts = async (items, signal) => { calls.products.push({ items, signal }); return products ? products(items, signal, calls.products.length) : response(items.map(item => product(item))); };
  const controller = loadTs('src/features/cart/cart-controller.ts').createCartController({ store, local: env.local, actions, loadProducts, newId: env.newId });
  return { controller, store, calls, env };
}

test('duplicate start and initial enterCart coalesce, a repeated start keeps cache and later entry clears selection', async () => {
  const first = deferred();
  const { controller, store, calls } = setup({ read: (_, n) => n === 1 ? first.promise : ok(cartView()) });
  const start = controller.start(member(A));
  const duplicate = controller.start(member(A));
  const entered = controller.enterCart();
  await until(() => calls.read.length === 1);
  first.resolve(ok(cartView()));
  await Promise.all([start, duplicate, entered]);
  assert.equal(store.getState().phase, 'ready');
  assert.equal(calls.read.length, 1);
  await controller.start(member(A));
  store.getState().setSelected(I1, true);
  assert.equal(calls.access, 0); // a repeated same-account start checks nothing
  assert.equal(calls.read.length, 1);
  assert.deepEqual(store.getState().selectedIds, [I1]);
  await controller.enterCart();
  assert.equal(calls.read.length, 2);
  assert.deepEqual(store.getState().selectedIds, []);
  controller.dispose();
});

test('member initialization stages guest once, sends its own merge once and never consumes another account queue', async () => {
  const env = storageEnvironment();
  await env.local.updateGuest(0, [line()]);
  const other = { version: 1, requestId: env.newId(), expectedUserId: B, operation: { kind: 'remove_items', itemIds: [I2] } };
  await env.local.enqueue(other);
  const { controller, calls, store } = setup({ env });
  await controller.start(member(A));
  assert.equal(calls.mutate.length, 1);
  assert.deepEqual(calls.mutate[0].operation, { kind: 'merge_guest', items: [{ productId: 1, variantId: 2, quantity: 2 }] });
  assert.equal(await env.local.peek(A), null);
  assert.deepEqual(await env.local.peek(B), other);
  assert.deepEqual((await env.local.read()).guest.items, []);
  assert.equal(calls.read.length, 0);
  assert.equal(store.getState().phase, 'ready');
  assert.deepEqual(store.getState().selectedIds, []);
});

test('lost response retains the durable request, blocks new commands and retries identical content', async () => {
  const { controller, env, calls, store } = setup({ mutate: (cmd, n) => n === 1 ? { status: 'retryable', message: 'Retry' } : ok(receipt(cmd)) });
  await controller.start(member(A));
  assert.equal((await controller.adjustQuantity(I1, 1)).status, 'retryable');
  const pending = await env.local.peek(A);
  assert.equal(store.getState().phase, 'retryable');
  await controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  assert.equal(calls.mutate.length, 1);
  await controller.retry();
  assert.deepEqual(calls.mutate, [pending, pending]);
  assert.equal(await env.local.peek(A), null);
  assert.equal(store.getState().phase, 'ready');
});

test('ack storage failure keeps the old visible cart and exact pending request until retry', async () => {
  const env = storageEnvironment();
  const { controller, store, calls } = setup({ env, mutate: cmd => { env.fail(true); return ok(receipt(cmd, 'applied', { items: [{ ...cartView().items[0], quantity: 3 }] })); } });
  await controller.start(member(A));
  await controller.adjustQuantity(I1, 1);
  assert.equal(store.getState().phase, 'retryable');
  assert.equal(store.getState().cart.items[0].quantity, 2);
  const pending = await env.local.peek(A);
  env.fail(false);
  const ack = env.local.ack;
  env.local.ack = async cmd => { env.fail(false); return ack(cmd); };
  await controller.retry();
  assert.deepEqual(calls.mutate, [pending, pending]);
  assert.equal(store.getState().cart.items[0].quantity, 3);
  assert.equal(store.getState().phase, 'ready');
});

test('invalid and conflict replies release the original command without resending or minting replacements', async () => {
  for (const status of ['invalid', 'conflict']) {
    const { controller, calls, env, store } = setup({ mutate: () => ({ status, message: 'Recovery required' }) });
    await controller.start(member(A));
    assert.equal((await controller.removeItems([I1])).status, status);
    assert.equal(await env.local.peek(A), null);
    const sent = calls.mutate.length;
    await controller.retry();
    assert.equal(calls.mutate.length, sent); // neither the rejected ID nor a new one is sent again
    assert.equal(store.getState().phase, 'ready');
  }
});

test('confirmed rejected/noop receipts are acknowledged and return ready with their outcome intact', async () => {
  for (const outcome of ['rejected', 'noop']) {
    const { controller, store, env } = setup({ mutate: cmd => ok(receipt(cmd, outcome)) });
    await controller.start(member(A));
    const result = await controller.adjustQuantity(I1, -1);
    assert.equal(result.status, 'ok');
    assert.equal(result.cart.operation.outcome, outcome);
    assert.equal(await env.local.peek(A), null);
    assert.equal(store.getState().phase, 'ready');
  }
});

test('late A response cannot overwrite B or acknowledge A after an account transition', async () => {
  const late = deferred();
  const { controller, calls, store, env } = setup({ mutate: () => late.promise });
  await controller.start(member(A));
  const change = controller.adjustQuantity(I1, 1);
  await until(() => calls.mutate.length === 1);
  const pending = await env.local.peek(A);
  await controller.start(member(B));
  assert.equal(store.getState().cart.owner.userId, B);
  late.resolve(ok(receipt(pending, 'applied', { revision: '999' })));
  await change;
  assert.equal(store.getState().cart.owner.userId, B);
  assert.deepEqual(await env.local.peek(A), pending);
});

test('starting a different account locks mutations synchronously before initialization awaits', async () => {
  const later = deferred();
  const { controller, store, calls } = setup({ read: input => input.expectedUserId === B ? later.promise : ok(cartView()) });
  await controller.start(member(A));
  const switched = controller.start(member(B));
  assert.notEqual(store.getState().phase, 'ready');
  assert.equal(store.getState().cart, null);
  assert.equal((await controller.adjustQuantity(I1, 1)).status, 'retryable');
  assert.equal(calls.mutate.length, 0);
  later.resolve(ok(cartView({ owner: { kind: 'member', userId: B }, cartId: CART_B })));
  await switched;
  assert.equal(store.getState().phase, 'ready');
});

test('different cartId with a larger revision cannot update the view or acknowledge its request', async () => {
  const { controller, store, env } = setup({ mutate: (cmd, n) => ok(receipt(cmd, 'applied', {
    cartId: n === 1 ? CART_B : CART_A, revision: '9007199254740999',
  })) });
  await controller.start(member(A));
  await controller.adjustQuantity(I1, 1);
  assert.equal(store.getState().cart.cartId, CART_A);
  assert.equal(store.getState().cart.revision, '1');
  assert.equal(store.getState().phase, 'retryable');
  assert.ok(await env.local.peek(A));
  await controller.retry();
  assert.equal(store.getState().cart.revision, '9007199254740999');
  assert.equal(await env.local.peek(A), null);
});

test('revision comparison stays exact above Number.MAX_SAFE_INTEGER and rejects a lower mutation reply', async () => {
  const { controller, store, env } = setup({ read: () => ok(cartView({ revision: '9007199254740993' })),
    mutate: (cmd, n) => ok(receipt(cmd, 'applied', { revision: n === 1 ? '9007199254740992' : '9007199254740994' })) });
  await controller.start(member(A));
  await controller.adjustQuantity(I1, 1);
  assert.equal(store.getState().cart.revision, '9007199254740993');
  assert.ok(await env.local.peek(A));
  await controller.retry();
  assert.equal(store.getState().cart.revision, '9007199254740994');
});

test('wrong owner, receipt, malformed identity and inconsistent availability cannot clear pending state', async () => {
  for (const override of [
    { owner: { kind: 'member', userId: B } }, { cartId: null }, { revision: 2 },
    { operation: { requestId: I2, outcome: 'applied', notices: [], itemIdMap: {} } },
    { items: [{ ...cartView().items[0], stock: 0, canSelect: true }] },
  ]) {
    const { controller, env, store } = setup({ mutate: cmd => ok(receipt(cmd, 'applied', override)) });
    await controller.start(member(A)); await controller.adjustQuantity(I1, 1);
    assert.equal(store.getState().phase, 'retryable');
    assert.equal(store.getState().cart.owner.userId, A);
    assert.ok(await env.local.peek(A));
  }
});

test('request order wins over a late larger revision in the same owner generation', async () => {
  const old = deferred();
  const { controller, calls, store } = setup({ read: (_, n) => n === 2 ? old.promise : ok(cartView({ revision: String(n) })) });
  await controller.start(member(A));
  const entered = controller.enterCart(); await until(() => calls.read.length === 2);
  await controller.recheck('navigation');
  old.resolve(ok(cartView({ revision: '999' }))); await entered;
  assert.equal(store.getState().cart.revision, '3');
});

test('dispose ignores outstanding replies and start can recover the same pending operation in a new generation', async () => {
  const old = deferred();
  const { controller, calls, env, store } = setup({ mutate: (cmd, n) => n === 1 ? old.promise : ok(receipt(cmd, 'applied', { revision: '3' })) });
  await controller.start(member(A));
  const change = controller.adjustQuantity(I1, 1); await until(() => calls.mutate.length === 1);
  const pending = await env.local.peek(A);
  controller.dispose();
  await controller.start(member(A));
  assert.deepEqual(calls.mutate, [pending]); // a remount never resends on its own
  assert.equal(store.getState().unresolved, true);
  old.resolve(ok(receipt(pending, 'applied', { revision: '999' }))); await change;
  await controller.retry();
  assert.deepEqual(calls.mutate, [pending, pending]);
  assert.equal(store.getState().cart.revision, '3');
  assert.equal(store.getState().phase, 'ready');
});

test('access_changed recovers the new actual account while retaining the old account command', async () => {
  const { controller, store, env } = setup({ mutate: () => ({ status: 'access_changed', access: member(B) }) });
  await controller.start(member(A));
  assert.equal((await controller.adjustQuantity(I1, 1)).status, 'access_changed');
  assert.equal(store.getState().cart.owner.userId, B);
  assert.ok(await env.local.peek(A));
});

test('restricted/error initialization preserves guest data without member calls or guest fallback', async () => {
  for (const access of [{ status: 'restricted', reason: 'unverified' }, { status: 'error', message: 'Unavailable' }]) {
    const env = storageEnvironment(); await env.local.updateGuest(0, [line()]); const original = env.raw();
    const { controller, calls, store } = setup({ env }); await controller.start(access);
    assert.equal(store.getState().phase, access.status === 'restricted' ? 'restricted' : 'retryable');
    assert.equal(store.getState().cart, null);
    assert.equal(calls.read.length + calls.mutate.length + calls.products.length, 0);
    assert.equal(env.raw(), original);
  }
});

test('guest restoration caps positive stock, preserves old sold-out quantities and removes unavailable pairs', async () => {
  const env = storageEnvironment();
  const missing = '10000000-0000-4000-8000-000000000003';
  await env.local.updateGuest(0, [line({ quantity: 5 }), line({ id: I2, productId: 2, variantId: 7, quantity: 4 }), line({ id: missing, productId: 9, variantId: 99 })]);
  const { controller, store } = setup({ env, products: () => response([product({ stock: 2 }), product({ productId: 2, variantId: 7, stock: 0 })]) });
  await controller.start(guest);
  assert.deepEqual((await env.local.read()).guest.items.map(item => [item.id, item.quantity]), [[I1, 2], [I2, 4]]);
  assert.deepEqual(store.getState().cart.items.map(item => item.canSelect), [true, false]);
  assert.deepEqual(store.getState().selectedIds, []);
  assert.equal(store.getState().cart.notices.length, 2);
});

test('old guest product results cannot clean or publish over a newer local guest revision', async () => {
  const env = storageEnvironment(); await env.local.updateGuest(0, [line()]); const old = deferred();
  const { controller, calls, store } = setup({ env, resolve: () => guest, products: (items, _, n) => n === 1 ? old.promise : response(items.map(item => product(item))) });
  const start = controller.start(guest); await until(() => calls.products.length === 1);
  const newer = [line(), line({ id: I2, productId: 2, variantId: 7 })];
  await env.local.updateGuest(1, newer);
  old.resolve(response([])); await start;
  assert.deepEqual((await env.local.read()).guest.items, newer);
  assert.equal(store.getState().phase, 'retryable');
  await controller.retry(); assert.equal(store.getState().cart.items.length, 2);
});

test('guest mutations use latest quantities, preserve source-to-target selection and never auto-select additions', async () => {
  const { controller, store, env } = setup({ resolve: () => guest });
  await controller.start(guest);
  await controller.addItems([{ productId: 1, variantId: 2, quantity: 2 }]);
  const source = store.getState().cart.items[0].id;
  assert.deepEqual(store.getState().selectedIds, []);
  store.getState().setSelected(source, true);
  await controller.adjustQuantity(source, 1);
  await controller.addItems([{ productId: 2, variantId: 7, quantity: 2 }]);
  const target = store.getState().cart.items.find(item => item.variantId === 7).id;
  await controller.changeOption(source, 2, 7);
  assert.deepEqual(store.getState().cart.items.map(item => [item.id, item.quantity]), [[target, 5]]);
  assert.deepEqual(store.getState().selectedIds, [target]);
  await controller.adjustQuantity(source, 1);
  await controller.removeItems([source]);
  assert.equal((await env.local.read()).guest.items[0].quantity, 5);
  await controller.removeItems([target]);
  await controller.addItems([{ productId: 2, variantId: 7, quantity: 1 }]);
  const replacement = store.getState().cart.items[0];
  assert.notEqual(replacement.id, target);
  await controller.removeItems([target]);
  assert.equal(store.getState().cart.items[0].id, replacement.id);
  assert.deepEqual(store.getState().selectedIds, []);
});

test('guest sold-out changes are rejected but option movement is allowed, and minimum one is a noop', async () => {
  const env = storageEnvironment(); await env.local.updateGuest(0, [line({ quantity: 5 })]);
  const { controller, store } = setup({ env, resolve: () => guest, products: items => response(items.map(item => product({ ...item, stock: item.variantId === 2 ? 0 : 10 }))) });
  await controller.start(guest);
  assert.equal((await controller.adjustQuantity(I1, 1)).cart.operation.outcome, 'rejected');
  assert.equal((await controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }])).cart.operation.outcome, 'rejected');
  assert.equal(store.getState().cart.items[0].quantity, 5);
  await controller.changeOption(I1, 2, 7);
  assert.equal(store.getState().cart.items[0].quantity, 5);
  const second = setup({ resolve: () => guest });
  await second.controller.start(guest); await second.controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  const id = second.store.getState().cart.items[0].id;
  assert.equal((await second.controller.adjustQuantity(id, -1)).cart.operation.outcome, 'noop');
  assert.equal(second.store.getState().cart.items.length, 1);
});

test('guest persistence failure preserves both durable source and last confirmed view', async () => {
  const { controller, env, store } = setup({ resolve: () => guest }); await controller.start(guest);
  const original = env.raw(); env.fail(true);
  assert.equal((await controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }])).status, 'retryable');
  assert.equal(env.raw(), original);
  assert.deepEqual(store.getState().cart.items, []);
  assert.equal(store.getState().phase, 'retryable');
  env.fail(false); await controller.retry(); assert.equal(store.getState().phase, 'ready');
});

test('auth transition locks immediately and failed signal persistence stays visible until explicit retry', async () => {
  const { controller, env, store } = setup({ resolve: () => guest }); await controller.start(member(A));
  store.getState().setSelected(I1, true); env.fail(true);
  controller.beginAuthTransition();
  assert.equal(store.getState().phase, 'checking');
  assert.equal(store.getState().cart, null);
  assert.deepEqual(store.getState().selectedIds, []);
  await until(() => store.getState().phase === 'retryable');
  env.fail(false); await controller.retry();
  assert.equal(store.getState().cart.owner.kind, 'guest');
  assert.equal((await env.local.read()).authEpoch, 1);
});

test('a plain storage signal checks nothing; an auth epoch change rechecks the actual account', async () => {
  let actual = member(A);
  const { controller, env, store, calls } = setup({ resolve: () => actual }); await controller.start(member(A));
  const before = calls.access;
  env.emit(); await setImmediate(); await setImmediate();
  assert.equal(calls.access, before);
  assert.equal(calls.read.length, 1);
  assert.equal(store.getState().phase, 'ready');
  actual = member(B); await env.local.announceAuthTransition(); env.emit();
  await until(() => store.getState().cart?.owner.userId === B && store.getState().phase === 'ready');
  assert.equal(calls.read.length, 2);
});

test('read notices deduplicate by cart and exact revision', async () => {
  const notice = { kind: 'quantity_adjusted', itemId: I1, variantId: 2, before: 5, after: 2 };
  const { controller, store } = setup({ read: (_, n) => ok(cartView({ revision: n < 3 ? '1' : '2', notices: [notice, notice] })) });
  await controller.start(member(A)); assert.equal(store.getState().cart.notices.length, 1);
  await controller.enterCart(); assert.deepEqual(store.getState().cart.notices, []);
  await controller.enterCart(); assert.equal(store.getState().cart.notices.length, 1);
});

test('member option mapping carries manual selection only to purchasable targets', async () => {
  const { controller, store } = setup({ mutate: cmd => ok(receipt(cmd, 'applied', {
    items: [{ ...cartView().items[0], id: I2, variantId: 7 }],
    operation: { requestId: cmd.requestId, outcome: 'applied', itemIdMap: { [I1]: I2 }, notices: [] },
  })) });
  await controller.start(member(A)); store.getState().setSelected(I1, true);
  await controller.changeOption(I1, 1, 7);
  assert.deepEqual(store.getState().selectedIds, [I2]);
});

test('auth epoch recovery renews the product signal instead of reusing an aborted request', async () => {
  const env = storageEnvironment(); await env.local.updateGuest(0, [line()]);
  const { controller, store, calls } = setup({ env, resolve: () => guest, products: (items, signal) => {
    signal.throwIfAborted(); return response(items.map(item => product(item)));
  } });
  await controller.start(guest);
  const first = calls.products[0].signal;
  await env.local.announceAuthTransition();
  await controller.retry(); // a same-account notice changes nothing; an explicit retry reloads
  assert.equal(first.aborted, true);
  assert.equal(store.getState().phase, 'ready');
  assert.notEqual(calls.products[1].signal, first);
  assert.equal(calls.products[1].signal.aborted, false);
});

test('access_changed to guest restores newly added local lines with a fresh product signal', async () => {
  const env = storageEnvironment();
  const { controller, store } = setup({ env, mutate: async () => {
    await env.local.updateGuest(0, [line()]);
    return { status: 'access_changed', access: guest };
  }, products: (items, signal) => { signal.throwIfAborted(); return response(items.map(item => product(item))); } });
  await controller.start(member(A));
  assert.equal((await controller.adjustQuantity(I1, 1)).status, 'access_changed');
  assert.equal(store.getState().phase, 'ready');
  assert.equal(store.getState().cart.owner.kind, 'guest');
  assert.deepEqual(store.getState().cart.items.map(item => item.id), [I1]);
  assert.ok(await env.local.peek(A));
});

test('guest adjustment reports stock capping', async () => {
  let stock = 10;
  const env = storageEnvironment(); await env.local.updateGuest(0, [line({ quantity: 5 })]);
  const { controller, store } = setup({ env, resolve: () => guest, products: items => response(items.filter(item => item.variantId !== 99).map(item => product({ ...item, stock }))) });
  await controller.start(guest); stock = 2;
  const adjusted = await controller.adjustQuantity(I1, 1);
  assert.deepEqual(adjusted.cart.notices, [{ kind: 'quantity_adjusted', itemId: I1, variantId: 2, before: 6, after: 2 }]);
  assert.equal(store.getState().cart.items[0].quantity, 2);
});

test('guest cleanup cannot turn a rejected command into applied', async () => {
  let stock = 10;
  const env = storageEnvironment(); await env.local.updateGuest(0, [line({ quantity: 5 })]);
  const { controller, store } = setup({ env, resolve: () => guest, products: items => response(items.filter(item => item.variantId !== 99).map(item => product({ ...item, stock }))) });
  await controller.start(guest);
  // A rejected add can coincide with unrelated cleanup after a catalog change.
  stock = 1;
  const rejected = await controller.addItems([{ productId: 9, variantId: 99, quantity: 1 }]);
  assert.equal(rejected.status, 'ok');
  assert.equal(rejected.cart.operation.outcome, 'rejected');
  assert.equal(store.getState().cart.items.find(item => item.id === I1).quantity, 1);
});

test('guest duplicate additions aggregate before stock caps and overflow leaves the source intact', async () => {
  const env = storageEnvironment(); await env.local.updateGuest(0, [line({ quantity: 2 })]);
  const { controller, store } = setup({ env, resolve: () => guest, products: items => response(items.map(item => product({ ...item, stock: 10 }))) });
  await controller.start(guest);
  const original = env.raw();
  assert.equal((await controller.addItems([
    { productId: 1, variantId: 2, quantity: 2147483645 }, { productId: 1, variantId: 2, quantity: 2 },
  ])).status, 'invalid');
  assert.equal(env.raw(), original);
  assert.equal(store.getState().cart.items[0].quantity, 2);
});

test('two controllers share one durable merge and recover its identity without duplicating guest quantities', async () => {
  const env = storageEnvironment(); await env.local.updateGuest(0, [line()]);
  const sent = []; const release = deferred();
  const mutate = async command => { sent.push(command); await release.promise; return ok(receipt(command)); };
  const first = setup({ env, mutate }); const second = setup({ env, mutate });
  const one = first.controller.start(member(A)); const two = second.controller.start(member(A));
  await until(() => sent.length === 1 && [first, second].every(instance => ['retryable', 'syncing'].includes(instance.store.getState().phase)));
  assert.deepEqual(sent[0].operation.items, [{ productId: 1, variantId: 2, quantity: 2 }]);
  release.resolve(); await Promise.all([one, two]);
  assert.equal(await env.local.peek(A), null);
  for (const instance of [first, second]) if (instance.store.getState().phase !== 'ready') await instance.controller.retry();
  assert.equal(sent.length, 1); // the waiting tab only rereads
  for (const instance of [first, second]) {
    assert.equal(instance.store.getState().phase, 'ready');
    assert.deepEqual(instance.store.getState().selectedIds, []);
    instance.controller.dispose();
  }
});

test('dispose aborts a guest fetch and a late response cannot restore or clean the cart', async () => {
  const env = storageEnvironment(); await env.local.updateGuest(0, [line()]); const late = deferred();
  const { controller, store, calls } = setup({ env, products: () => late.promise });
  const start = controller.start(guest); await until(() => calls.products.length === 1);
  controller.dispose();
  assert.equal(calls.products[0].signal.aborted, true);
  late.resolve(response([])); await start;
  assert.equal(store.getState().cart, null);
  assert.deepEqual((await env.local.read()).guest.items, [line()]);
});

test('public product client sends only pair IDs, no-store and cancellation, and validates JSON responses', async t => {
  const { loadCartProducts } = loadTs('src/features/cart/cart.product-client.ts');
  const original = globalThis.fetch; t.after(() => { globalThis.fetch = original; });
  const requests = [];
  globalThis.fetch = async (url, options) => { requests.push({ url, options }); return Response.json(response([product()])); };
  const abort = new AbortController();
  assert.equal((await loadCartProducts([{ productId: 1, variantId: 2 }], abort.signal)).cartItems[0].discountRate, 20);
  assert.equal(requests[0].url, '/api/cart/products');
  assert.equal(requests[0].options.cache, 'no-store');
  assert.equal(requests[0].options.signal, abort.signal);
  assert.deepEqual(JSON.parse(requests[0].options.body), [{ productId: 1, variantId: 2 }]);
  for (const value of [{}, { cartItems: [product({ stock: -1 })], optionGroups: {} }]) {
    globalThis.fetch = async () => Response.json(value);
    await assert.rejects(loadCartProducts([{ productId: 1, variantId: 2 }]));
  }
  globalThis.fetch = async () => Response.json({ message: 'PRIVATE_DETAIL' }, { status: 500 });
  await assert.rejects(loadCartProducts([]), error => !error.message.includes('PRIVATE_DETAIL'));
});

function twoTabs(resolve, overrides = []) {
  let raw = null, tail = Promise.resolve(), sequence = 0;
  const tabs = [];
  const locks = { request: (_, callback) => { const result = tail.then(callback); tail = result.catch(() => {}); return result; } };
  const newId = () => `60000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
  const { createCartLocalAdapter } = loadTs('src/domains/cart/cart.local.ts');
  for (let index = 0; index < 2; index++) {
    const listeners = new Set();
    const storage = { getItem: () => raw, setItem: (_, value) => {
      raw = value;
      queueMicrotask(() => tabs.forEach((tab, other) => { if (other !== index) tab.emit(); }));
    } };
    const local = createCartLocalAdapter({ storage, locks, newId, events: { subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); } } });
    const env = { local, newId, emit: () => listeners.forEach(fn => fn({ key: 'bang-cart:v1', storageArea: storage })) };
    tabs.push({ ...setup({ env, resolve, ...overrides[index] }), emit: env.emit });
  }
  return tabs;
}

test('auth completion broadcasts login with an empty guest and logout after its pending signal', async t => {
  let actual = guest;
  const [first, second] = twoTabs(() => actual);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(guest), second.controller.start(guest)]);
  actual = member(A);
  // Real login: the server redirect gives the running tab a new member snapshot; nothing else writes storage.
  await first.controller.start(member(A));
  await until(() => second.store.getState().access?.status === 'member' && second.store.getState().phase === 'ready');
  first.controller.beginAuthTransition();
  await until(() => second.store.getState().cart === null);
  await setImmediate(); await setImmediate();
  assert.notEqual(second.store.getState().phase, 'ready', 'pending logout must not unlock the old member');
  await second.controller.start(member(A)); // stale server props during pending logout
  assert.notEqual(second.store.getState().phase, 'ready', 'a different tab cannot complete the initiating logout');
  actual = guest;
  await first.controller.start(guest); // server snapshot after logout completes on the same URL
  await until(() => second.store.getState().access?.status === 'guest' && second.store.getState().phase === 'ready');
  assert.equal(second.store.getState().cart.owner.kind, 'guest');
});

for (const mismatch of ['missing', 'stock', 'size', 'priceOffset']) test(`guest contradictory own option (${mismatch}) preserves the original document and retries`, async t => {
  const env = storageEnvironment();
  await env.local.updateGuest(0, [line()]);
  const before = await env.local.read(); let consistent = false;
  const own = product();
  const group = () => ({ [own.styleId]: [{ productId: own.productId, styleId: own.styleId, color: { id: 1, label: own.color, hex: '#888888' }, variants: mismatch === 'missing' && !consistent ? [] : [{ id: own.variantId, size: !consistent && mismatch === 'size' ? 'WRONG' : own.size, stock: !consistent && mismatch === 'stock' ? 0 : own.stock, priceOffset: own.priceOffset + (!consistent && mismatch === 'priceOffset' ? 1 : 0) }] }] });
  const { controller, store } = setup({ env, resolve: () => guest, products: () => ({ cartItems: [own], optionGroups: group() }) });
  t.after(() => controller.dispose());
  await controller.start(guest);
  assert.equal(store.getState().phase, 'retryable');
  assert.equal(store.getState().cart, null);
  assert.deepEqual(await env.local.read(), before);
  consistent = true; await controller.retry();
  assert.equal(store.getState().phase, 'ready');
  assert.equal(store.getState().cart.items[0].canSelect, true);
});

test('a pending auth signal blocks a mutation even before its storage event is delivered', async t => {
  const env = storageEnvironment(); const { controller, store, calls } = setup({ env });
  t.after(() => controller.dispose()); await controller.start(member(A));
  await env.local.announceAuthTransition(true); // deliberately no native event yet
  await controller.adjustQuantity(I1, 1);
  assert.equal(calls.mutate.length, 0);
  assert.equal(await env.local.peek(A), null);
  assert.equal(store.getState().cart, null);
  assert.equal(store.getState().access, null);
  // Another tab started the transition, so this open tab offers an explicit recheck.
  assert.equal(store.getState().phase, 'retryable');
  assert.match(store.getState().message, /다른 창/);
});

test('every port call receives the flow signal and a superseded mutation is replayed with the same request ID', async () => {
  const held = deferred();
  const { controller, store, calls, env } = setup({ mutate: (command, n) => n === 1 ? held.promise : ok(receipt(command)) });
  await controller.start(member(A));
  assert.ok(calls.signals.length > 0);
  assert.ok(calls.signals.every(signal => signal instanceof AbortSignal));
  const change = controller.adjustQuantity(I1, 1);
  await until(() => calls.mutate.length === 1);
  const first = calls.signals.at(-1);
  assert.equal(first.aborted, false);
  const recheck = controller.recheck('retry');
  assert.equal(first.aborted, true);
  held.resolve(ok(receipt(calls.mutate[0])));
  await Promise.all([change, recheck]);
  await until(() => store.getState().phase === 'ready');
  assert.equal(calls.mutate.length, 2);
  assert.deepEqual(calls.mutate[1], calls.mutate[0]);
  assert.deepEqual(JSON.parse(env.raw()).pendingByAccount, {});
});

test('an open tab that meets another tab\'s pending transition shows a retry and recovers on explicit retry', async t => {
  const env = storageEnvironment(); const { controller, store, calls } = setup({ env });
  t.after(() => controller.dispose()); await controller.start(member(A));
  await env.local.announceAuthTransition(true); env.emit();
  await until(() => store.getState().phase === 'retryable');
  assert.match(store.getState().message, /다른 창/);
  assert.equal(store.getState().cart, null);
  const accessBefore = calls.access;
  await controller.retry();
  assert.ok(calls.access > accessBefore);
  assert.equal(store.getState().phase, 'ready');
  assert.equal((await env.local.read()).authPending, false);
});

test('re-entry with an interrupted transition checks the real session first and completes the same epoch', async t => {
  const env = storageEnvironment();
  await env.local.enqueue({ version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } });
  await env.local.announceAuthTransition(true);
  const before = await env.local.read();
  const { controller, store, calls } = setup({ env });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  assert.equal(store.getState().phase, 'retryable');
  assert.equal(store.getState().unresolved, true);
  assert.ok(calls.access >= 1);
  const after = await env.local.read();
  assert.equal(after.authPending, false);
  assert.ok(after.authEpoch > before.authEpoch);
  assert.equal(calls.mutate.length, 0); // the preserved A request waits for an explicit retry
  await controller.retry();
  assert.equal(calls.mutate.length, 1);
  assert.equal(store.getState().phase, 'ready');
});

test('re-entry keeps the lock and every pending request when the session check fails', async t => {
  const env = storageEnvironment();
  const pending = { version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } };
  await env.local.enqueue(pending);
  await env.local.announceAuthTransition(true);
  const before = await env.local.read();
  const { controller, store, calls } = setup({ env, resolve: () => ({ status: 'error', message: 'down' }) });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  assert.equal(store.getState().phase, 'retryable');
  assert.equal(calls.mutate.length, 0);
  assert.deepEqual(await env.local.read(), before);
});

test('a transition started during the re-entry check is not released by the older result', async t => {
  const env = storageEnvironment();
  await env.local.announceAuthTransition(true);
  const { controller, store } = setup({ env, resolve: async () => { await env.local.announceAuthTransition(true); return member(A); } });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  assert.equal(store.getState().phase, 'retryable');
  assert.equal((await env.local.read()).authPending, true);
});

test('the initiating tab records completion unconditionally even after another tab advanced the epoch', async t => {
  const env = storageEnvironment(); const { controller, store } = setup({ env, resolve: () => guest });
  t.after(() => controller.dispose()); await controller.start(member(A));
  controller.beginAuthTransition();
  await setImmediate();
  const started = await env.local.read();
  assert.equal(started.authPending, true);
  assert.equal(await env.local.completeAuthTransition(started.authEpoch), true); // allowed race: a new tab completes first
  const raced = await env.local.read();
  await controller.start(guest);
  const finished = await env.local.read();
  assert.equal(finished.authPending, false);
  assert.ok(finished.authEpoch > raced.authEpoch, 'other tabs must still receive a storage notification');
  assert.equal(store.getState().phase, 'ready');
});

test('first mounts and repeated identical snapshots never broadcast; a real account change broadcasts once', async t => {
  let actual = guest;
  const [first, second] = twoTabs(() => actual);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(guest), second.controller.start(guest)]);
  await first.controller.start(guest); // equivalent server props re-created
  assert.equal((await first.env.local.read()).authEpoch, 0);
  actual = member(A);
  await first.controller.start(member(A)); // login with an empty guest cart: no merge write
  assert.equal((await first.env.local.read()).authEpoch, 1);
  await until(() => second.store.getState().access?.status === 'member' && second.store.getState().phase === 'ready');
  await first.controller.start(member(A));
  assert.equal((await first.env.local.read()).authEpoch, 1);
});

test('a tab that recovered from an initial access error still receives other tabs\' account changes', async t => {
  let actual = member(A);
  const [first, second] = twoTabs(() => actual); // the error comes only from the initial server snapshot
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await first.controller.start({ status: 'error', message: 'temporary' });
  assert.equal(first.store.getState().phase, 'retryable');
  await first.controller.retry();
  assert.equal(first.store.getState().access?.status, 'member');
  await second.controller.start(member(A));
  actual = guest;
  second.controller.beginAuthTransition();
  await second.controller.start(guest);
  await until(() => first.store.getState().access?.status === 'guest' && first.store.getState().phase === 'ready');
  assert.equal(first.store.getState().cart.owner.kind, 'guest');
});

test('returning to the same account through an error snapshot does not broadcast an account change', async t => {
  const env = storageEnvironment(); const { controller, store } = setup({ env });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  const epoch = (await env.local.read()).authEpoch;
  await controller.start({ status: 'error', message: 'temporary' });
  assert.equal(store.getState().phase, 'retryable');
  await controller.start(member(A));
  assert.equal(store.getState().phase, 'ready');
  assert.equal((await env.local.read()).authEpoch, epoch);
});

test('retrying a failed account notice stays conditional and cannot release another tab\'s pending logout', async t => {
  const env = storageEnvironment(); let actual = guest;
  const { controller, store } = setup({ env, resolve: () => actual });
  t.after(() => controller.dispose());
  await controller.start(guest);
  actual = member(A);
  env.fail(true);
  await controller.start(member(A)); // the login notice cannot be written
  assert.equal(store.getState().phase, 'retryable');
  env.fail(false);
  await env.local.announceAuthTransition(true); // another tab starts a logout meanwhile
  actual = { status: 'error', message: 'session check failed' };
  await controller.retry();
  assert.equal((await env.local.read()).authPending, true);
  assert.equal(store.getState().phase, 'retryable');
});

test('another tab acking this tab\'s in-flight request does not abort it or show a false failure', async t => {
  const held = deferred();
  const [first, second] = twoTabs(() => member(A), [{ mutate: (command, n) => n === 1 ? held.promise : ok(receipt(command)) }]);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  const change = first.controller.adjustQuantity(I1, 1);
  await until(() => first.calls.mutate.length === 1);
  await setImmediate(); await setImmediate();
  assert.equal(second.calls.mutate.length, 0); // the other tab never sends a request it did not create
  held.resolve(ok(receipt(first.calls.mutate[0])));
  const reply = await change;
  assert.equal(reply.status, 'ok');
  await until(() => first.store.getState().phase === 'ready');
  assert.deepEqual((await first.env.local.read()).pendingByAccount, {});
});

test('an interrupted login merge resumes only if the guest cart is unchanged since that login', async t => {
  for (const changedByAnotherTab of [true, false]) {
    const env = storageEnvironment();
    await env.local.updateGuest(0, [line()]);
    const { controller } = setup({ env, resolve: () => guest });
    t.after(() => controller.dispose());
    env.fail(true);
    await controller.start(member(A)); // stageMerge(A) cannot be written
    env.fail(false);
    if (changedByAnotherTab) await env.local.updateGuest(1, [line(), line({ id: I2, variantId: 4, quantity: 1 })]);
    await controller.start(guest); // logout before the A merge was retried
    const document = await env.local.read();
    if (changedByAnotherTab) {
      assert.equal(document.pendingByAccount[A], undefined, 'another person\'s guest items must not move to A');
      assert.equal(document.guest.items.length, 2);
    } else {
      assert.deepEqual(document.pendingByAccount[A].map(command => command.operation.kind), ['merge_guest']);
      assert.deepEqual(document.guest.items, []);
    }
  }
});

test('a guest option change into an existing line keeps that line\'s position', async t => {
  const I3 = '10000000-0000-4000-8000-000000000003';
  const env = storageEnvironment();
  await env.local.updateGuest(0, [line(), line({ id: I2, variantId: 4, quantity: 1 }), line({ id: I3, variantId: 5, quantity: 1 })]);
  const { controller, store } = setup({ env, resolve: () => guest });
  t.after(() => controller.dispose());
  await controller.start(guest);
  await controller.changeOption(I1, 1, 4);
  assert.deepEqual(store.getState().cart.items.map(item => item.id), [I2, I3]);
  assert.deepEqual((await env.local.read()).guest.items.map(item => item.id), [I2, I3]);
});

test('a queued request the server definitively rejects is released so later changes are not blocked', async t => {
  for (const status of ['invalid', 'conflict']) {
    const env = storageEnvironment();
    const stuck = { version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } };
    await env.local.enqueue(stuck);
    const { controller, store, calls } = setup({ env, mutate: (command, n) => n === 1 ? { status, message: '확정 거부' } : ok(receipt(command)) });
    t.after(() => controller.dispose());
    await controller.start(member(A));
    assert.equal(store.getState().unresolved, true, status);
    assert.equal(calls.mutate.length, 0);
    const reads = calls.read.length;
    await controller.retry();
    assert.equal(store.getState().phase, 'ready', status);
    assert.equal(await env.local.peek(A), null);
    assert.equal(store.getState().settledRequests[stuck.requestId].outcome, 'rejected');
    assert.equal(calls.read.length, reads + 1); // the current cart is re-read after the release
    assert.equal((await controller.adjustQuantity(I1, 1)).status, 'ok');
  }
});

test('a new change the server definitively rejects refreshes the cart before returning ready', async t => {
  for (const status of ['invalid', 'conflict']) {
    const env = storageEnvironment();
    const { controller, store, calls } = setup({
      env,
      mutate: () => ({ status, message: '확정 거부' }),
      read: (_, n) => ok(cartView({ revision: String(n), items: [{ ...cartView().items[0], quantity: n === 1 ? 2 : 8 }] })),
    });
    t.after(() => controller.dispose());
    await controller.start(member(A));
    const reply = await controller.adjustQuantity(I1, 1);
    assert.equal(reply.status, status);
    assert.equal(store.getState().phase, 'ready');
    assert.equal(calls.read.length, 2, 'a definitive rejection still requires a current cart snapshot');
    assert.equal(store.getState().cart.items[0].quantity, 8);
    assert.equal(store.getState().settledRequests[reply.requestId].outcome, 'rejected');
    assert.equal(await env.local.peek(A), null);
  }
});

test('a failed cart refresh after a definitive rejection locks changes until retry succeeds', async t => {
  for (const status of ['invalid', 'conflict']) {
    const env = storageEnvironment();
    let recovered = false;
    const { controller, store, calls } = setup({
      env,
      mutate: () => ({ status, message: '확정 거부' }),
      read: (_, n) => n === 1 || recovered
        ? ok(cartView({ revision: String(n), items: [{ ...cartView().items[0], quantity: n === 1 ? 2 : 8 }] }))
        : { status: 'retryable', message: '현재 내역 조회 실패' },
    });
    t.after(() => controller.dispose());
    await controller.start(member(A));
    const reply = await controller.adjustQuantity(I1, 1);
    assert.equal(reply.status, 'retryable');
    assert.equal(store.getState().phase, 'retryable');
    assert.equal(store.getState().cart.items[0].quantity, 2, 'retain the last confirmed view while locked');
    assert.equal(store.getState().settledRequests[reply.requestId].outcome, 'rejected');
    assert.equal(await env.local.peek(A), null, 'the confirmed rejection remains settled');
    assert.equal((await controller.adjustQuantity(I1, 1)).status, 'retryable');
    assert.equal(calls.mutate.length, 1);
    recovered = true;
    await controller.retry();
    assert.equal(store.getState().phase, 'ready');
    assert.equal(store.getState().cart.items[0].quantity, 8);
    assert.equal(calls.mutate.length, 1, 'never replay the definitively rejected request');
  }
});

test('same-account server props during an in-flight change wait for it instead of aborting it', async t => {
  const held = deferred();
  const env = storageEnvironment();
  const { controller, store, calls } = setup({ env, mutate: (command, n) => n === 1 ? held.promise : ok(receipt(command)) });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  await env.local.announceAuthTransition(); env.emit(); // an epoch change resets the start bookkeeping
  await until(() => store.getState().phase === 'ready');
  const change = controller.adjustQuantity(I1, 1);
  await until(() => calls.mutate.length === 1);
  const restarted = controller.start(member(A)); // e.g. a cookie-refreshing Server Action re-rendered the root layout
  held.resolve(ok(receipt(calls.mutate[0])));
  assert.equal((await change).status, 'ok');
  await restarted;
  assert.equal(calls.mutate.length, 1);
  assert.equal(store.getState().phase, 'ready');
});

test('a login merge moves only the guest items it read, not items another tab added before the lock', async t => {
  const base = storageEnvironment();
  await base.local.updateGuest(0, [line()]);
  const other = line({ id: I2, variantId: 4, quantity: 1 });
  let reads = 0;
  // The second read is initialize's; right after it, another tab logs out and a new guest adds an item.
  const local = { ...base.local, read: async () => { const document = await base.local.read(); if (++reads === 2) await base.local.updateGuest(document.guest.revision, [other]); return document; } };
  const { controller } = setup({ env: { ...base, local } });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  const saved = await base.local.read();
  assert.deepEqual(saved.guest.items, [other]);
  assert.ok(!(saved.pendingByAccount[A] ?? []).some(command => command.operation.kind === 'merge_guest' && command.operation.items.some(item => item.variantId === 4)));
});

test('another tab\'s auth transition is handled at once even while a change is in flight', async t => {
  const held = deferred();
  const env = storageEnvironment();
  const { controller, store, calls } = setup({ env, mutate: (command, n) => n === 1 ? held.promise : ok(receipt(command)) });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  const change = controller.adjustQuantity(I1, 1);
  await until(() => calls.mutate.length === 1);
  await env.local.announceAuthTransition(true); env.emit(); // another tab starts logging out
  await until(() => store.getState().cart === null);
  assert.equal(store.getState().phase, 'retryable');
  held.resolve(ok(receipt(calls.mutate[0])));
  await change;
  assert.equal(store.getState().cart, null);
});

test('a tab that followed another tab\'s login does not announce it again after an error snapshot', async t => {
  let actual = guest;
  const [first, second] = twoTabs(() => actual);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(guest), second.controller.start(guest)]);
  actual = member(A);
  await first.controller.start(member(A));
  await until(() => second.store.getState().access?.status === 'member' && second.store.getState().phase === 'ready');
  const epoch = (await second.env.local.read()).authEpoch;
  await second.controller.start(member(A)); // its own server props catch up with the login
  await second.controller.start({ status: 'error', message: 'temporary' });
  await second.controller.start(member(A));
  assert.equal(second.store.getState().phase, 'ready');
  assert.equal((await second.env.local.read()).authEpoch, epoch);
});

const mergeItems = command => command.operation.items;
const rejectMerges = (status = 'invalid') => command => command.operation.kind === 'merge_guest' ? { status, message: '확정 거부' } : ok(receipt(command));

test('a login merge the server definitively rejects is held for that account and told once', async t => {
  for (const status of ['invalid', 'conflict']) {
    const env = storageEnvironment();
    await env.local.updateGuest(0, [line()]);
    const { controller, store, calls } = setup({ env, mutate: rejectMerges(status) });
    t.after(() => controller.dispose());
    await controller.start(member(A));
    assert.equal(store.getState().phase, 'ready', status);
    const document = await env.local.read();
    assert.equal(await env.local.peek(A), null);
    assert.deepEqual(document.guest.items, [], 'the shared guest cart stays empty');
    assert.deepEqual(document.heldByAccount[A], [{ productId: 1, variantId: 2, quantity: 2 }]);
    assert.equal(calls.read.length, 1);
    assert.deepEqual(store.getState().cart.notices.filter(notice => notice.kind === 'merge_returned'), [{ kind: 'merge_returned' }]);
    await controller.enterCart();
    assert.equal(calls.mutate.length, 1, 'cart entry does not resend a held merge');
    assert.equal(store.getState().heldCount, 1);
    assert.equal(store.getState().cart.notices.some(notice => notice.kind === 'merge_returned'), false, 'the notice is shown once');
  }
});

test('two open tabs send a deterministic merge rejection once and keep its items held', async t => {
  let sends = 0;
  const slow = async command => { if (command.operation.kind === 'merge_guest') sends++; await new Promise(resolve => setTimeout(resolve, 5)); return rejectMerges()(command); };
  const [first, second] = twoTabs(() => member(A), [{ mutate: slow }, { mutate: slow }]);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await first.env.local.updateGuest(0, [line()]);
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  await new Promise(resolve => setTimeout(resolve, 300));
  const settled = sends;
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(sends, settled, 'no further merge sends once both tabs settle');
  assert.equal(sends, 1, 'only the tab that staged the merge sends it');
  // The other tab met that merge while it was pending; its explicit retry only rereads.
  for (const tab of [first, second]) if (tab.store.getState().phase !== 'ready') await tab.controller.retry();
  assert.equal(sends, 1);
  assert.equal(first.store.getState().phase, 'ready');
  assert.equal(second.store.getState().phase, 'ready');
  assert.deepEqual((await first.env.local.read()).heldByAccount[A], [{ productId: 1, variantId: 2, quantity: 2 }]);
});

test('a held merge stays with its account through logout and never reaches the next account', async t => {
  const env = storageEnvironment(); let actual = member(A);
  await env.local.updateGuest(0, [line()]);
  const { controller, store, calls } = setup({ env, resolve: () => actual, mutate: rejectMerges() });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  actual = guest;
  controller.beginAuthTransition();
  await controller.start(guest);
  assert.equal(store.getState().phase, 'ready');
  assert.deepEqual(store.getState().cart.items, [], 'the logged-out member\'s items are not on the guest screen');
  actual = member(B);
  controller.beginAuthTransition();
  await controller.start(member(B));
  assert.equal(store.getState().phase, 'ready');
  assert.ok(!calls.mutate.some(command => command.expectedUserId === B && command.operation.kind === 'merge_guest'));
  assert.equal(store.getState().cart.notices.some(notice => notice.kind === 'merge_returned'), false);
  assert.deepEqual((await env.local.read()).heldByAccount[A], [{ productId: 1, variantId: 2, quantity: 2 }]);
});

test('a held merge stays held when the same account enters again', async t => {
  const env = storageEnvironment();
  await env.local.updateGuest(0, [line()]);
  const first = setup({ env, mutate: rejectMerges() });
  await first.controller.start(member(A));
  first.controller.dispose();
  const again = setup({ env }); // a fresh page load of the same member
  t.after(() => again.controller.dispose());
  await again.controller.start(member(A));
  assert.equal(again.store.getState().phase, 'ready');
  assert.equal(again.calls.mutate.length, 0, 'held items move only on the user\'s request');
  assert.equal(again.store.getState().heldCount, 1);
  assert.deepEqual((await env.local.read()).heldByAccount[A], [{ productId: 1, variantId: 2, quantity: 2 }]);
});

test('entering the cart while another tab\'s login is pending keeps the retry instead of an endless spinner', async t => {
  const env = storageEnvironment(); const { controller, store } = setup({ env });
  t.after(() => controller.dispose()); await controller.start(member(A));
  await env.local.announceAuthTransition(true); env.emit();
  await until(() => store.getState().phase === 'retryable');
  await controller.enterCart();
  assert.equal(store.getState().phase, 'retryable');
  assert.match(store.getState().message, /다른 창/);
  await controller.retry();
  assert.equal(store.getState().phase, 'ready');
});

test('an add made while another tab\'s request is still queued is blocked and retry sends only that request', async t => {
  const env = storageEnvironment(); const { controller, store, calls } = setup({ env });
  t.after(() => controller.dispose()); await controller.start(member(A));
  const foreign = { version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } };
  await env.local.enqueue(foreign); // another tab's add is in flight; no storage event has arrived yet
  const reply = await controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  assert.equal(reply.status, 'retryable');
  assert.equal(reply.message, '확인이 필요한 장바구니 요청이 있습니다. 다시 시도를 눌러 확인해주세요.');
  assert.equal(reply.requestId, undefined);
  assert.equal(calls.mutate.length, 0);
  assert.equal(store.getState().unresolved, true);
  await controller.retry();
  assert.deepEqual(calls.mutate.map(command => command.requestId), [foreign.requestId]);
  assert.equal(await env.local.peek(A), null);
  assert.equal(store.getState().phase, 'ready');
});

async function holdFor(local, userId, items = [line()]) {
  const { revision } = (await local.read()).guest;
  await local.updateGuest(revision, items);
  await local.holdMerge(await local.stageMerge(userId));
}

test('a tab that followed another tab\'s logout keeps held items and tells other tabs when the same account logs in there', async t => {
  let actual = member(A);
  const [first, second] = twoTabs(() => actual);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  await holdFor(first.env.local, A);
  await until(() => first.store.getState().phase === 'ready' && second.store.getState().phase === 'ready');
  actual = guest;
  first.controller.beginAuthTransition();
  await first.controller.start(guest);
  await until(() => second.store.getState().access?.status === 'guest' && second.store.getState().phase === 'ready');
  actual = member(A);
  await second.controller.start(member(A)); // the login redirect in the tab that only learned of the logout
  assert.equal(second.store.getState().phase, 'ready');
  assert.equal(second.calls.mutate.filter(command => command.operation.kind === 'merge_guest').length, 0);
  assert.equal(second.store.getState().heldCount, 1);
  assert.deepEqual((await second.env.local.read()).heldByAccount[A], [{ productId: 1, variantId: 2, quantity: 2 }]);
  await until(() => first.store.getState().access?.status === 'member' && first.store.getState().phase === 'ready');
});

test('a fresh mount that recovers from an error snapshot shows the account\'s held items without moving them', async t => {
  const env = storageEnvironment();
  await holdFor(env.local, A);
  const { controller, store, calls } = setup({ env });
  t.after(() => controller.dispose());
  await controller.start({ status: 'error', message: 'temporary' });
  assert.equal(store.getState().phase, 'retryable');
  await controller.retry();
  assert.equal(store.getState().phase, 'ready');
  assert.equal(calls.mutate.length, 0);
  assert.equal(store.getState().heldCount, 1);
  assert.equal((await controller.moveHeldItems()).status, 'ok');
  assert.deepEqual(calls.mutate.map(mergeItems), [[{ productId: 1, variantId: 2, quantity: 2 }]]);
  assert.equal((await env.local.read()).heldByAccount?.[A], undefined);
});

test('a same-account auth signal during an add still reports the applied add, not an account change', async t => {
  const held = deferred();
  const env = storageEnvironment();
  const { controller, calls } = setup({ env, mutate: (command, n) => n === 1 ? held.promise : ok(receipt(command)) });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  const adding = controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  await until(() => calls.mutate.length === 1);
  await env.local.notifyAccountChange(); // e.g. another tab recovered the same session
  held.resolve(ok(receipt(calls.mutate[0])));
  const reply = await adding;
  assert.equal(reply.status, 'ok');
  assert.equal(reply.cart.operation.requestId, reply.requestId);
  assert.equal(new Set(calls.mutate.map(command => command.requestId)).size, 1, 'never a second add intent');
});

test('an applied add stays reported as applied when a later drained request restarts the flow', async t => {
  const base = storageEnvironment();
  const other = { version: 1, requestId: base.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } };
  let injected = false;
  // Right after this tab's add is acked, another tab queues its own change.
  const local = { ...base.local, ack: async command => {
    await base.local.ack(command);
    if (command.operation.kind === 'add_items' && !injected) { injected = true; await base.local.enqueue(other); }
  } };
  const { controller, store, calls } = setup({ env: { ...base, local }, mutate: async command => {
    if (command.requestId === other.requestId && calls.mutate.filter(sent => sent.requestId === other.requestId).length === 1) await base.local.notifyAccountChange();
    return ok(receipt(command));
  } });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  const reply = await controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  assert.equal(reply.status, 'ok');
  assert.equal(reply.cart.operation.requestId, reply.requestId);
  assert.equal(calls.mutate.filter(command => command.operation.kind === 'add_items').length, 1);
  assert.equal(store.getState().phase, 'ready');
});

test('stale props from before a login another tab announced do not announce an account change again', async t => {
  let actual = guest;
  const [first, second] = twoTabs(() => actual);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(guest), second.controller.start(guest)]);
  actual = member(A);
  await first.controller.start(member(A));
  await until(() => second.store.getState().access?.status === 'member' && second.store.getState().phase === 'ready');
  const epoch = (await second.env.local.read()).authEpoch;
  await second.controller.start(guest); // props rendered before the login cookie reached this tab
  assert.equal((await second.env.local.read()).authEpoch, epoch);
});

test('a same-account login elsewhere, delivered before the reply, keeps the add applied and its result recorded', async t => {
  const held = deferred();
  const [first, second] = twoTabs(() => member(A), [{ mutate: (command, n) => n === 1 ? held.promise : ok(receipt(command)) }]);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  const add = first.controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  await until(() => first.calls.mutate.length === 1);
  await second.env.local.notifyAccountChange(); // storage event reaches the first tab before its reply
  await setImmediate(); await setImmediate();
  held.resolve(ok(receipt(first.calls.mutate[0])));
  const reply = await add;
  assert.equal(reply.status, 'ok');
  assert.equal(first.store.getState().settledRequests[reply.requestId].outcome, 'applied');
  assert.equal(first.calls.mutate.length, 1);
  assert.equal(first.store.getState().phase, 'ready');
});

test('a transient access error during a same-account notice neither aborts the add nor forgets its result', async t => {
  let fail = false; const held = deferred();
  const [first, second] = twoTabs(() => fail ? { status: 'error', message: 'x' } : member(A), [{ mutate: (command, n) => n === 1 ? held.promise : ok(receipt(command)) }]);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  const mark = first.calls.signals.length; // the finished start flow's signal is aborted by the next launch; only this add's signals count
  const add = first.controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  await until(() => first.calls.mutate.length === 1);
  fail = true; await second.env.local.notifyAccountChange(); await setImmediate();
  await until(() => first.calls.access >= 1);
  await setImmediate();
  assert.equal(first.store.getState().access, null);
  assert.equal(first.store.getState().cart, null, 'an unresolved account hides its cart before the add finishes');
  held.resolve(ok(receipt(first.calls.mutate[0])));
  const reply = await add;
  assert.equal(reply.status, 'ok');
  assert.ok(first.store.getState().settledRequests[reply.requestId]);
  assert.equal(first.calls.signals.slice(mark).filter(signal => signal.aborted).length, 0);
  assert.equal(await first.env.local.peek(A), null); // confirmed by the server for A, so acknowledged
  assert.equal(first.store.getState().phase, 'retryable'); // the account is unknown, so the view stays locked
  assert.equal(first.store.getState().cart, null);
  assert.equal(first.calls.mutate.length, 1);
});

test('a logout start from another tab hides the cart at once even behind a stuck access check and a stuck add', async t => {
  const never = deferred(); let stuck = false;
  const [first, second] = twoTabs(() => stuck ? never.promise : member(A), [{ mutate: () => never.promise }]);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  void first.controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  await until(() => first.calls.mutate.length === 1);
  stuck = true; await second.env.local.notifyAccountChange(); await setImmediate(); // its access check never answers
  await second.env.local.announceAuthTransition(true); // another tab starts logging out
  await until(() => first.store.getState().cart === null);
  assert.equal(first.store.getState().access, null);
});

test('a plain quantity notice from another tab makes no cart request', async t => {
  const [first, second] = twoTabs(() => member(A));
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  await setImmediate(); await setImmediate();
  const before = { access: first.calls.access, read: first.calls.read.length };
  await second.controller.adjustQuantity(I1, 1); await setImmediate(); await setImmediate();
  assert.deepEqual({ access: first.calls.access, read: first.calls.read.length }, before);
  assert.equal(first.calls.mutate.length, 0);
});

test('a remount with a pending request shows the cart read-only and resends nothing until retry', async () => {
  const env = storageEnvironment();
  const stuck = { version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } };
  await env.local.enqueue(stuck);
  const { controller, store, calls } = setup({ env });
  await controller.start(member(A));
  assert.equal(calls.mutate.length, 0);
  assert.equal(calls.read.length, 1);
  assert.equal(store.getState().phase, 'retryable');
  assert.equal(store.getState().unresolved, true);
  assert.ok(store.getState().cart);
  assert.equal((await controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }])).status, 'retryable');
  assert.equal(calls.mutate.length, 0);
  await controller.retry();
  assert.deepEqual(calls.mutate, [stuck]);
  assert.equal(store.getState().unresolved, false);
  assert.equal(store.getState().phase, 'ready');
});

test('a login with nothing pending sends its new merge once; with an earlier pending request it holds the merge', async () => {
  for (const earlier of [false, true]) {
    const env = storageEnvironment(); await env.local.updateGuest(0, [line()]);
    if (earlier) await env.local.enqueue({ version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } });
    const { controller, calls, store } = setup({ env });
    await controller.start(member(A));
    assert.equal(calls.mutate.length, earlier ? 0 : 1, String(earlier));
    assert.equal(store.getState().unresolved, earlier);
    assert.equal((await env.local.read()).guest.items.length, 0); // bound to A either way
  }
});

test('a request another tab saves right before the merge is staged keeps the new merge unsent', async () => {
  const env = storageEnvironment(); await env.local.updateGuest(0, [line()]);
  const stageMerge = env.local.stageMerge;
  // Another tab enqueues between this tab's account check and its stageMerge lock.
  env.local.stageMerge = async (...args) => { await env.local.enqueue({ version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } }); return stageMerge(...args); };
  const { controller, calls, store } = setup({ env });
  await controller.start(member(A));
  assert.equal(calls.mutate.length, 0);
  assert.equal(store.getState().unresolved, true);
  assert.equal((await env.local.read()).pendingByAccount[A].length, 2);
});

test('the other open tab neither sends a login merge it did not create nor stays locked after an explicit retry', async t => {
  // Either tab may stage the merge first (the login notice races the initiating tab's stageMerge); only the stager sends.
  let actual = guest; const held = deferred();
  const hold = { mutate: async command => { await held.promise; return ok(receipt(command)); } };
  const tabs = twoTabs(() => actual, [hold, hold]);
  t.after(() => tabs.forEach(tab => tab.controller.dispose()));
  await tabs[0].env.local.updateGuest(0, [line()]);
  await Promise.all(tabs.map(tab => tab.controller.start(guest)));
  actual = member(A); const login = tabs[0].controller.start(member(A));
  await until(() => tabs.every(tab => tab.store.getState().access?.status === 'member') && tabs.some(tab => tab.calls.mutate.length === 1));
  const sender = tabs.find(tab => tab.calls.mutate.length === 1); const other = tabs.find(tab => tab !== sender);
  assert.equal(other.calls.mutate.length, 0);
  await until(() => other.store.getState().unresolved === true);
  held.resolve(); await login; await until(() => sender.store.getState().phase === 'ready');
  await other.controller.retry();
  assert.equal(other.calls.mutate.length, 0);
  assert.equal(other.store.getState().phase, 'ready');
  assert.equal(other.store.getState().unresolved, false);
});

test('cart entry during a change that never answers keeps the last cart visible and starts nothing', async () => {
  const never = deferred();
  const { controller, store, calls } = setup({ mutate: () => never.promise });
  await controller.start(member(A));
  const mark = calls.signals.length;
  void controller.adjustQuantity(I1, 1); await until(() => calls.mutate.length === 1);
  void controller.enterCart(); await setImmediate();
  assert.ok(store.getState().cart);
  assert.equal(store.getState().phase, 'mutating');
  assert.equal(calls.read.length, 1);
  assert.equal(calls.mutate.length, 1);
  assert.equal(calls.signals.slice(mark).filter(signal => signal.aborted).length, 0);
});

test('held items stay held on every entry and move only when the user asks', async () => {
  const env = storageEnvironment(); await holdFor(env.local, A);
  const { controller, store, calls } = setup({ env });
  await controller.start(member(A)); await controller.enterCart();
  assert.equal(calls.mutate.length, 0);
  assert.equal(store.getState().heldCount, 1);
  const reply = await controller.moveHeldItems();
  assert.equal(reply.status, 'ok');
  assert.ok(reply.requestId);
  assert.equal(calls.mutate.length, 1);
  assert.equal(calls.mutate[0].operation.kind, 'merge_guest');
  assert.equal(store.getState().heldCount, 0);
  assert.equal((await env.local.read()).heldByAccount, undefined);
  assert.equal(store.getState().phase, 'ready');
});

test('moving held items stays unsent when another tab saved a request after this screen was ready', async () => {
  const env = storageEnvironment(); await holdFor(env.local, A);
  const { controller, calls, store } = setup({ env });
  await controller.start(member(A));
  assert.equal(store.getState().unresolved, false);
  await env.local.enqueue({ version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } });
  assert.equal((await controller.moveHeldItems()).status, 'retryable');
  assert.equal(calls.mutate.length, 0);
  assert.equal(store.getState().unresolved, true);
  assert.equal((await env.local.read()).heldByAccount[A].length, 1);
});

test('moving held items is refused while an uncertain request is pending', async () => {
  const env = storageEnvironment(); await holdFor(env.local, A);
  await env.local.enqueue({ version: 1, requestId: env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } });
  const { controller, calls } = setup({ env });
  await controller.start(member(A));
  assert.equal((await controller.moveHeldItems()).status, 'retryable');
  assert.equal(calls.mutate.length, 0);
});

test('a logout-start notice read just before this tab\'s login props does not strand the login tab', async t => {
  let actual = guest;
  const [first, second] = twoTabs(() => actual);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(guest), second.controller.start(guest)]);
  first.controller.beginAuthTransition(); await setImmediate(); await setImmediate();
  actual = member(A);
  first.emit(); await Promise.resolve(); await Promise.resolve(); // its read is queued before the login props' own auth write
  await first.controller.start(member(A));
  await until(() => first.store.getState().phase === 'ready');
  assert.deepEqual(first.store.getState().access, member(A));
  assert.equal((await first.env.local.read()).authPending, false);
});

test('a lost login-merge reply flags the account as needing a check', async () => {
  const env = storageEnvironment(); await env.local.updateGuest(0, [line()]);
  const { controller, store, calls } = setup({ env, mutate: () => ({ status: 'retryable', message: 'net' }) });
  await controller.start(member(A));
  assert.equal(calls.mutate.length, 1);
  assert.equal(store.getState().phase, 'retryable');
  assert.equal(store.getState().unresolved, true);
});

test('a late access error from a notice does not undo a newer successful check of the same epoch', async t => {
  let errors = 0; const held = deferred();
  const [first, second] = twoTabs(() => errors-- > 0 ? { status: 'error', message: 'x' } : member(A), [{ mutate: (command, n) => n === 1 ? held.promise : ok(receipt(command)) }]);
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  const add = first.controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  await until(() => first.calls.mutate.length === 1);
  errors = 1; await second.env.local.notifyAccountChange(); // the notice's check fails once…
  await until(() => first.calls.access >= 1);
  held.resolve(ok(receipt(first.calls.mutate[0]))); // …then the add's own check confirms A for that epoch
  assert.equal((await add).status, 'ok');
  for (let i = 0; i < 5; i++) await setImmediate();
  assert.equal(first.store.getState().phase, 'ready');
});

test('an access error notice keeps the specific message of a request awaiting retry', async t => {
  let fail = false;
  const [first, second] = twoTabs(() => fail ? { status: 'error', message: 'x' } : member(A));
  t.after(() => { first.controller.dispose(); second.controller.dispose(); });
  await first.env.local.enqueue({ version: 1, requestId: first.env.newId(), expectedUserId: A, operation: { kind: 'remove_items', itemIds: [I2] } });
  await Promise.all([first.controller.start(member(A)), second.controller.start(member(A))]);
  assert.equal(first.store.getState().unresolved, true);
  fail = true; await second.env.local.notifyAccountChange();
  await until(() => first.calls.access >= 1); for (let i = 0; i < 5; i++) await setImmediate();
  assert.equal(first.store.getState().message, '확인이 필요한 장바구니 요청이 있습니다. 다시 시도를 눌러 확인해주세요.');
});

test('quantity notices do not repeat a failed auth check', async t => {
  let actual = { status: 'error', message: 'offline' };
  const { controller, store, env, calls } = setup({ resolve: () => actual });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  await env.local.notifyAccountChange();
  await controller.recheck('storage');
  await until(() => store.getState().phase === 'retryable');
  assert.equal(calls.access, 1);
  actual = member(B);
  for (let revision = 0; revision < 3; revision++) {
    await env.local.updateGuest(revision, []);
    await controller.recheck('storage');
    await setImmediate();
  }
  assert.equal(calls.access, 1, 'quantity-only writes do not retry the failed epoch');
  assert.equal(calls.read.length, 1);
  assert.equal(calls.mutate.length, 0);
  // A genuinely new account notification still starts one check and loads B.
  await env.local.notifyAccountChange();
  await controller.recheck('storage');
  await until(() => store.getState().cart?.owner.userId === B && store.getState().phase === 'ready');
  assert.equal(calls.access, 2);
});

test('quantity notices do not replace an auth check already in flight', async t => {
  const access = deferred();
  const { controller, store, env, calls } = setup({ resolve: () => access.promise });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  await env.local.notifyAccountChange();
  await controller.recheck('storage');
  assert.equal(calls.access, 1);
  await env.local.updateGuest(0, []);
  await controller.recheck('storage');
  assert.equal(calls.access, 1);
  access.resolve(member(B));
  await until(() => store.getState().cart?.owner.userId === B && store.getState().phase === 'ready');
  assert.equal(calls.read.length, 2);
});

for (const recoveredUser of [A, B]) test(`an unknown account hides the pending cart until manual recovery to ${recoveredUser === A ? 'the same account' : 'another account'}`, async t => {
  let actual = { status: 'error', message: 'offline' };
  const { controller, store, env, calls } = setup({ resolve: () => actual,
    mutate: (command, n) => n === 2 ? { status: 'retryable', message: 'lost response' } : ok(receipt(command)) });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  const settled = await controller.adjustQuantity(I1, 1);
  store.getState().setSelected(I1, true);
  assert.equal((await controller.removeItems([I1])).status, 'retryable');
  const pending = await env.local.peek(A);
  await env.local.notifyAccountChange();
  await controller.recheck('storage');
  await until(() => calls.access === 1);
  await setImmediate();
  assert.equal(store.getState().access, null);
  assert.equal(store.getState().cart, null);
  assert.deepEqual(store.getState().selectedIds, []);
  const { selectCartItemCount, selectCartNeedsCheck } = loadTs('src/features/cart/cart-count.ts');
  assert.equal(selectCartItemCount(store.getState()), null);
  assert.equal(selectCartNeedsCheck(store.getState()), false);
  assert.equal(store.getState().settledRequests[settled.requestId].outcome, 'applied');
  assert.deepEqual(await env.local.peek(A), pending);
  await controller.enterCart(); // recovery stays explicit; entry cannot revive stale owner props
  assert.equal(calls.access, 1);
  assert.equal(calls.mutate.length, 2);
  actual = member(recoveredUser);
  await controller.retry();
  assert.equal(store.getState().phase, 'ready');
  assert.equal(store.getState().cart.owner.userId, recoveredUser);
  if (recoveredUser === A) {
    assert.deepEqual(calls.mutate.slice(1), [pending, pending]);
    assert.equal(await env.local.peek(A), null);
    assert.equal(store.getState().settledRequests[settled.requestId].outcome, 'applied');
  } else {
    assert.equal(calls.mutate.length, 2, 'B never sends the preserved A request');
    assert.deepEqual(await env.local.peek(A), pending);
    assert.deepEqual(store.getState().settledRequests, {});
  }
});

test('an auth failure during local acknowledgement cannot republish the old cart or abort the request on same-account props', async t => {
  const acknowledged = deferred(); const release = deferred(); let fail = false;
  const base = storageEnvironment();
  const local = { ...base.local, ack: async command => {
    acknowledged.resolve(); await release.promise; await base.local.ack(command);
  } };
  const { controller, store, calls } = setup({ env: { ...base, local }, resolve: () => fail ? { status: 'error', message: 'offline' } : member(A) });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  await controller.recheck('auth'); // clears the old start job; later props must preserve the current change
  const mark = calls.signals.length;
  const change = controller.adjustQuantity(I1, 1);
  await acknowledged.promise;
  fail = true; await local.notifyAccountChange(); await controller.recheck('storage');
  await until(() => calls.access >= 2);
  await setImmediate();
  assert.equal(store.getState().cart, null);
  const props = controller.start(member(A));
  assert.equal(calls.signals.slice(mark).some(signal => signal.aborted), false);
  release.resolve();
  const reply = await change;
  await props;
  assert.equal(reply.status, 'ok');
  assert.equal(calls.mutate.length, 1);
  assert.equal(store.getState().cart, null);
  assert.equal(store.getState().phase, 'retryable');
  assert.equal(store.getState().settledRequests[reply.requestId].outcome, 'applied');
  assert.equal(await local.peek(A), null);
});

test('a change started after an unseen auth epoch verifies the account before publishing its result', async t => {
  const held = deferred();
  const { controller, store, env, calls } = setup({ resolve: () => ({ status: 'error', message: 'offline' }), mutate: () => held.promise });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  await env.local.notifyAccountChange(); // stored already, but its storage event has not reached this tab
  const change = controller.adjustQuantity(I1, 1);
  await until(() => calls.mutate.length === 1);
  held.resolve(ok(receipt(calls.mutate[0])));
  const reply = await change;
  assert.equal(reply.status, 'ok');
  assert.equal(store.getState().cart, null);
  assert.equal(store.getState().access, null);
  assert.equal(store.getState().settledRequests[reply.requestId].outcome, 'applied');
  assert.equal(await env.local.peek(A), null);
  assert.equal(calls.access, 1);
  await env.local.updateGuest(0, []);
  await controller.recheck('storage');
  await setImmediate();
  assert.equal(calls.access, 1, 'the mutation-side check already handled this auth epoch');
});

test('an older auth notice error cannot hide a cart confirmed for a newer epoch', async t => {
  const oldAccess = deferred(); const held = deferred(); let checks = 0;
  const { controller, store, env, calls } = setup({ resolve: () => ++checks === 1 ? oldAccess.promise : member(A), mutate: () => held.promise });
  t.after(() => controller.dispose());
  await controller.start(member(A));
  const change = controller.adjustQuantity(I1, 1);
  await until(() => calls.mutate.length === 1);
  await env.local.notifyAccountChange();
  await controller.recheck('storage'); // epoch 1's check stays in flight
  await env.local.notifyAccountChange(); // epoch 2 is confirmed by the mutation before its storage event arrives
  held.resolve(ok(receipt(calls.mutate[0])));
  assert.equal((await change).status, 'ok');
  assert.equal(store.getState().phase, 'ready');
  oldAccess.resolve({ status: 'error', message: 'late error' });
  for (let n = 0; n < 3; n++) await setImmediate();
  assert.equal(store.getState().phase, 'ready');
  assert.deepEqual(store.getState().access, member(A));
  assert.equal(store.getState().cart.owner.userId, A);
  assert.equal(calls.access, 2);
});
