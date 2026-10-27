import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, B, I1, I2, cartView } from './helpers/cart-fixtures.mjs';
import { productResponse } from './helpers/cart-products.mjs';

const R = n => `20000000-0000-4000-8000-00000000000${n}`;
const member = (userId = A) => ({ status: 'member', userId });
const guest = { status: 'guest' };
const line = (overrides = {}) => ({ id: I1, productId: 1, variantId: 2, quantity: 1, ...overrides });
const product = (overrides = {}) => ({
  productId: 1, styleId: 1, variantId: 2, name: '그레이 티셔츠', color: '그레이', thumbnailUrl: '/file.svg',
  price: 10000, discountRate: 20, priceOffset: 1000, size: 'M', stock: 10, ...overrides,
});
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const itemOf = (quantity, overrides = {}) => ({ ...cartView().items[0], quantity, ...overrides });
const okFor = (command, cart = cartView(), outcome = 'applied', extra = {}) => ({ status: 'ok', cart: { ...cart, operation: { requestId: command.requestId, outcome, itemIdMap: {}, notices: [], ...extra } } });

function setup({ guestItems = [], products = [product()], storage: storageOverride } = {}) {
  const store = loadTs('src/domains/cart/cart.store.ts').createCartStore();
  const data = new Map();
  const storage = storageOverride === undefined ? { getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } } : storageOverride;
  const local = loadTs('src/domains/cart/cart.local.ts').createCartLocalAdapter({ storage });
  if (guestItems.length) local.write(guestItems);
  const calls = { read: [], mutate: [], access: 0, products: [] };
  const replies = { read: [], mutate: [], access: [], products: [] };
  const take = (queue, fallback) => { const next = queue.shift(); return next === undefined ? fallback() : typeof next === 'function' ? next() : next; };
  const notes = { info: [], error: [] };
  let id = 0;
  const newId = () => R(++id);
  const controller = loadTs('src/features/cart/cart-controller.ts').createCartController({
    store, local, newId,
    notify: { info: message => notes.info.push(message), error: message => notes.error.push(message) },
    loadProducts: async pairs => { calls.products.push(pairs); return take(replies.products, () => productResponse(products)); },
    actions: {
      resolveAccess: async () => { calls.access++; return take(replies.access, () => guest); },
      read: async input => { calls.read.push(input); return take(replies.read, () => ({ status: 'ok', cart: cartView() })); },
      mutate: async command => { calls.mutate.push(command); return take(replies.mutate, () => okFor(command)); },
    },
  });
  const state = () => store.getState();
  return { store, local, data, calls, replies, notes, controller, state, idle: () => controller.whenIdle() };
}

async function startedMember(options) {
  const cart = setup(options);
  cart.controller.start(member());
  await cart.idle();
  return cart;
}

// --- member ---

test('member start reads the cart and becomes ready', async () => {
  const { state, calls } = await startedMember();
  assert.equal(state().phase, 'ready');
  assert.equal(state().busy, false);
  assert.deepEqual(calls.read, [{ expectedUserId: A }]);
  assert.equal(state().cart.items[0].quantity, 2);
});

test('member start reads the server cart when guest storage is unavailable', async () => {
  const { state, calls } = await startedMember({ storage: null });
  assert.equal(state().phase, 'ready');
  assert.equal(calls.mutate.length, 0);
  assert.equal(calls.read.length, 1);
});

test('member start failure shows error and only retry recovers', async () => {
  const cart = setup();
  cart.replies.read.push({ status: 'retryable', message: 'x' });
  cart.controller.start(member());
  await cart.idle();
  assert.deepEqual([cart.state().phase, cart.state().message, cart.state().cart], ['error', '장바구니를 불러오지 못했습니다.', null]);
  assert.equal(cart.controller.adjustQuantity(I1, 1), false);
  assert.equal(cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]), false);
  cart.controller.retry();
  await cart.idle();
  assert.equal(cart.state().phase, 'ready');
});

test('change shows immediately, blocks the next change and sends one request', async () => {
  const cart = await startedMember();
  const reply = deferred();
  cart.replies.mutate.push(() => reply.promise);
  assert.equal(cart.controller.adjustQuantity(I1, 1), true);
  assert.equal(cart.state().cart.items[0].quantity, 3);
  assert.equal(cart.state().busy, true);
  assert.equal(cart.controller.adjustQuantity(I1, 1), false);
  assert.equal(cart.controller.removeItems([I1]), false);
  assert.equal(cart.calls.mutate.length, 1);
  reply.resolve(okFor(cart.calls.mutate[0], cartView({ items: [itemOf(3)] })));
  await cart.idle();
  assert.equal(cart.state().busy, false);
  assert.equal(cart.state().cart.items[0].quantity, 3);
});

test('add raises the header count before the reply', async () => {
  const cart = await startedMember();
  const reply = deferred();
  cart.replies.mutate.push(() => reply.promise);
  assert.equal(cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 2 }]), true);
  assert.equal(cart.state().pendingAdd, 2);
  assert.equal(cart.state().cart.items[0].quantity, 2, 'the list waits for the reply');
  reply.resolve(okFor(cart.calls.mutate[0], cartView({ items: [itemOf(4)] })));
  await cart.idle();
  assert.equal(cart.state().pendingAdd, 0);
  assert.equal(cart.state().cart.items[0].quantity, 4);
  assert.equal(cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 0 }]), false);
  assert.equal(cart.controller.addItems([]), false);
});

test('ok reply replaces the cart and reports server notices once', async () => {
  const cart = await startedMember();
  const notice = { kind: 'quantity_adjusted', itemId: I1, variantId: 2, before: 11, after: 10 };
  cart.replies.mutate.push(() => okFor(cart.calls.mutate[0], cartView({ items: [itemOf(10)], notices: [notice, notice] }), 'applied', { notices: [notice] }));
  cart.controller.adjustQuantity(I1, 1);
  await cart.idle();
  assert.equal(cart.state().cart.items[0].quantity, 10);
  assert.deepEqual(cart.notes.info, ['현재 재고에 맞게 수량을 조정했습니다.']);
  assert.deepEqual(cart.notes.error, []);
});

test('rejected reply uses the reply cart and the reason notice', async () => {
  const cart = await startedMember();
  const notice = { kind: 'sold_out', variantId: 5 };
  cart.replies.mutate.push(() => okFor(cart.calls.mutate[0], cartView({ notices: [notice] }), 'rejected', { notices: [notice] }));
  cart.controller.addItems([{ productId: 1, variantId: 5, quantity: 1 }]);
  await cart.idle();
  assert.equal(cart.state().pendingAdd, 0);
  assert.deepEqual(cart.notes.info, ['품절된 옵션은 새로 담거나 수량을 변경할 수 없습니다.']);
  assert.deepEqual(cart.notes.error, []);
});

test('rejected without notices reports the action failure', async () => {
  const cart = await startedMember();
  cart.replies.mutate.push(() => okFor(cart.calls.mutate[0], cartView(), 'rejected'));
  cart.controller.changeOption(I1, 1, 3);
  await cart.idle();
  assert.deepEqual(cart.notes.error, ['옵션 변경을 저장하지 못했습니다.']);
  assert.equal(cart.state().cart.items[0].variantId, 2);
});

test('network failure re-reads and reports once', async () => {
  for (const failure of [() => Promise.reject(new Error('offline')), { status: 'retryable', message: 'x' }, { status: 'invalid', message: 'x' }, { status: 'conflict', message: 'x' }]) {
    const cart = await startedMember();
    cart.replies.mutate.push(failure);
    cart.replies.read.push({ status: 'ok', cart: cartView({ items: [itemOf(5)] }) });
    cart.controller.adjustQuantity(I1, 1);
    await cart.idle();
    assert.equal(cart.calls.read.length, 2);
    assert.equal(cart.state().cart.items[0].quantity, 5);
    assert.equal(cart.state().phase, 'ready');
    assert.deepEqual(cart.notes.error, ['수량 변경을 저장하지 못했습니다.']);
  }
});

test('failure with failed re-read restores serverCart and shows error', async () => {
  const cart = await startedMember();
  cart.replies.mutate.push({ status: 'retryable', message: 'x' });
  cart.replies.read.push({ status: 'retryable', message: 'x' });
  cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 3 }]);
  await cart.idle();
  assert.equal(cart.state().phase, 'error');
  assert.equal(cart.state().pendingAdd, 0);
  assert.equal(cart.state().cart.items[0].quantity, 2);
  assert.deepEqual(cart.notes.error, ['장바구니에 담지 못했습니다.']);
  assert.equal(cart.controller.adjustQuantity(I1, 1), true, 'a shown cart still accepts changes');
  await cart.idle();
  assert.equal(cart.state().phase, 'ready');
});

test('access_changed restarts with the new access', async () => {
  const cart = await startedMember();
  cart.replies.mutate.push({ status: 'access_changed', access: guest });
  cart.controller.adjustQuantity(I1, 1);
  await cart.idle();
  assert.deepEqual(cart.state().access, guest);
  assert.equal(cart.state().phase, 'ready');
  assert.equal(cart.state().cart.owner.kind, 'guest');
  assert.deepEqual(cart.state().cart.items, []);
});

test('stale reply after restart changes nothing', async () => {
  const cart = await startedMember();
  const reply = deferred();
  cart.replies.mutate.push(() => reply.promise);
  cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 2 }]);
  cart.replies.read.push({ status: 'ok', cart: cartView({ owner: { kind: 'member', userId: B }, items: [] }) });
  cart.controller.start(member(B));
  assert.deepEqual([cart.state().busy, cart.state().pendingAdd], [true, 0]);
  reply.resolve(okFor(cart.calls.mutate[0], cartView({ items: [itemOf(4)] })));
  await cart.idle();
  assert.deepEqual(cart.state().cart.owner, { kind: 'member', userId: B });
  assert.deepEqual(cart.state().cart.items, []);
  assert.deepEqual([cart.state().busy, cart.state().pendingAdd], [false, 0]);
  assert.deepEqual(cart.notes.error, []);
});

test('option change keeps selection through itemIdMap', async () => {
  const cart = await startedMember();
  cart.store.getState().setSelected(I1, true);
  const moved = itemOf(2, { id: I2, variantId: 3, size: 'L' });
  cart.replies.mutate.push(() => okFor(cart.calls.mutate[0], cartView({ items: [moved] }), 'applied', { itemIdMap: { [I1]: I2 } }));
  cart.controller.changeOption(I1, 1, 3);
  await cart.idle();
  assert.deepEqual(cart.state().selectedIds, [I2]);
});

test('entering the cart re-reads only when not busy and clears selection', async () => {
  const cart = await startedMember();
  cart.store.getState().setSelected(I1, true);
  const reply = deferred();
  cart.replies.mutate.push(() => reply.promise);
  cart.controller.adjustQuantity(I1, 1);
  cart.controller.enterCart();
  assert.equal(cart.calls.read.length, 1, 'busy: no extra read');
  reply.resolve(okFor(cart.calls.mutate[0], cartView({ items: [itemOf(3)] })));
  await cart.idle();
  cart.controller.enterCart();
  assert.deepEqual(cart.state().selectedIds, []);
  assert.equal(cart.state().busy, true);
  assert.equal(cart.controller.adjustQuantity(I1, 1), false, 'changes wait for the entry read');
  await cart.idle();
  assert.equal(cart.calls.read.length, 2);
});

test('merge clears the guest cart on applied/noop, rejected, invalid, conflict', async () => {
  const cases = [
    [command => okFor(command, cartView(), 'applied'), [], []],
    [command => okFor(command, cartView(), 'noop'), [], []],
    [command => okFor(command, cartView(), 'rejected'), ['판매하지 않는 상품이라 옮기지 못했습니다.'], []],
    [() => ({ status: 'invalid', message: 'x' }), ['로그인 전에 담은 상품을 옮기지 못했습니다.'], [{ expectedUserId: A }]],
    [() => ({ status: 'conflict', message: 'x' }), ['로그인 전에 담은 상품을 옮기지 못했습니다.'], [{ expectedUserId: A }]],
  ];
  for (const [reply, errors, reads] of cases) {
    const cart = setup({ guestItems: [line({ quantity: 2 })] });
    cart.replies.mutate.push(() => reply(cart.calls.mutate[0]));
    cart.controller.start(member());
    await cart.idle();
    const sent = cart.calls.mutate[0];
    assert.deepEqual([sent.expectedUserId, sent.operation], [A, { kind: 'merge_guest', items: [{ productId: 1, variantId: 2, quantity: 2 }] }]);
    assert.deepEqual(cart.local.read().items, []);
    assert.deepEqual(cart.notes.error, errors);
    assert.deepEqual(cart.calls.read, reads);
    assert.equal(cart.state().phase, 'ready');
  }
});

test('merge without a reply keeps the guest cart and resends the same id next start', async () => {
  const cart = setup({ guestItems: [line()] });
  cart.replies.mutate.push(() => Promise.reject(new Error('offline')));
  cart.controller.start(member());
  await cart.idle();
  assert.equal(cart.state().phase, 'ready');
  assert.equal(cart.calls.read.length, 1);
  assert.deepEqual(cart.local.read().items, [line()]);
  assert.deepEqual(cart.notes.error, []);
  cart.controller.start(member());
  await cart.idle();
  assert.equal(cart.calls.mutate[1].requestId, cart.calls.mutate[0].requestId);
  assert.deepEqual(cart.local.read().items, []);
});

test('merge refused because the account changed restarts as that account and keeps the guest cart', async () => {
  const cart = setup({ guestItems: [line()] });
  cart.replies.mutate.push({ status: 'access_changed', access: guest });
  cart.controller.start(member());
  await cart.idle();
  assert.deepEqual(cart.state().access, guest);
  assert.equal(cart.state().phase, 'ready');
  assert.deepEqual(cart.calls.read, []);
  assert.deepEqual(cart.local.read().items, [line()]);
  assert.ok(cart.local.read().mergeId, 'the merge id is kept for the next member start');
});

test('a merge reply for another request or account is not trusted: the guest cart stays and the member cart is read', async () => {
  const replies = [
    command => okFor({ ...command, requestId: R(9) }),
    command => okFor(command, cartView({ owner: { kind: 'member', userId: B } })),
  ];
  for (const reply of replies) {
    const cart = setup({ guestItems: [line()] });
    cart.replies.mutate.push(() => reply(cart.calls.mutate[0]));
    cart.controller.start(member());
    await cart.idle();
    assert.deepEqual(cart.local.read().items, [line()]);
    assert.deepEqual(cart.calls.read, [{ expectedUserId: A }]);
    assert.equal(cart.state().phase, 'ready');
    assert.deepEqual(cart.notes.error, []);
  }
});

test('merge keeps newer guest items when mergeId changed', async () => {
  const cart = setup({ guestItems: [line()] });
  const reply = deferred();
  cart.replies.mutate.push(() => reply.promise);
  cart.controller.start(member());
  cart.local.write([line(), line({ id: I2, variantId: 3 })]);
  reply.resolve(okFor(cart.calls.mutate[0]));
  await cart.idle();
  assert.equal(cart.local.read().items.length, 2);
});

test('another tab raised quantity: +1 applies to the latest server value', async () => {
  const cart = await startedMember();
  cart.store.getState().setStateFromController({ cart: cartView({ items: [itemOf(1)] }) });
  cart.replies.mutate.push(() => okFor(cart.calls.mutate[0], cartView({ items: [itemOf(4)] })));
  cart.controller.adjustQuantity(I1, 1);
  assert.equal(cart.calls.mutate[0].operation.delta, 1);
  await cart.idle();
  assert.equal(cart.state().cart.items[0].quantity, 4);
});

// --- guest ---

async function startedGuest(options) {
  const cart = setup(options);
  cart.controller.start(guest);
  await cart.idle();
  return cart;
}

test('guest start builds the cart from saved lines', async () => {
  const cart = await startedGuest({ guestItems: [line({ quantity: 2 })] });
  assert.equal(cart.state().phase, 'ready');
  assert.deepEqual(cart.calls.products, [[{ productId: 1, variantId: 2 }]]);
  assert.deepEqual(cart.state().cart.items.map(item => [item.id, item.quantity, item.name]), [[I1, 2, '그레이 티셔츠']]);
  assert.equal(cart.calls.read.length + cart.calls.mutate.length, 0);
});

test('guest change saves immediately then blocks until products load', async () => {
  const cart = await startedGuest({ guestItems: [line()] });
  const load = deferred();
  cart.replies.products.push(() => load.promise);
  assert.equal(cart.controller.adjustQuantity(I1, 1), true);
  assert.deepEqual(cart.local.read().items, [line({ quantity: 2 })]);
  assert.equal(cart.state().cart.items[0].quantity, 2);
  assert.equal(cart.state().busy, true);
  assert.equal(cart.controller.adjustQuantity(I1, 1), false);
  load.resolve(productResponse([product()]));
  await cart.idle();
  assert.equal(cart.state().busy, false);
  assert.equal(cart.state().cart.items[0].quantity, 2);
});

test('guest add raises the header count until products load', async () => {
  const cart = await startedGuest();
  const load = deferred();
  cart.replies.products.push(() => load.promise);
  assert.equal(cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 3 }]), true);
  assert.equal(cart.state().pendingAdd, 3);
  load.resolve(productResponse([product()]));
  await cart.idle();
  assert.equal(cart.state().pendingAdd, 0);
  assert.equal(cart.state().cart.items[0].quantity, 3);
});

test('guest load failure keeps saved change and says it could not load', async () => {
  const cart = await startedGuest({ guestItems: [line()] });
  cart.replies.products.push(() => Promise.reject(new Error('offline')));
  cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 1 }]);
  await cart.idle();
  assert.deepEqual(cart.local.read().items, [line({ quantity: 2 })]);
  assert.deepEqual([cart.state().phase, cart.state().pendingAdd, cart.state().message], ['error', 0, '장바구니 정보를 불러오지 못했습니다.']);
  assert.deepEqual(cart.notes.error, ['장바구니 정보를 불러오지 못했습니다.']);
});

test('guest change applies to the latest storage, not the tab memory', async () => {
  const cart = await startedGuest({ guestItems: [line(), line({ id: I2, variantId: 3 })], products: [product(), product({ variantId: 3, size: 'L' })] });
  cart.local.write([line({ quantity: 3 })]);
  cart.controller.adjustQuantity(I1, 1);
  await cart.idle();
  assert.deepEqual(cart.local.read().items, [line({ quantity: 4 })]);
  assert.deepEqual(cart.state().cart.items.map(item => item.id), [I1]);
});

test('guest missing item does not save', async () => {
  const cart = await startedGuest({ guestItems: [line()] });
  cart.local.write([]);
  assert.equal(cart.controller.adjustQuantity(I1, 1), false);
  await cart.idle();
  assert.deepEqual(cart.local.read().items, []);
  assert.deepEqual(cart.notes.error, ['이미 변경되거나 삭제된 장바구니 항목입니다.']);
  assert.deepEqual(cart.state().cart.items, []);
});

test('guest retry rebuilds after a load failure', async () => {
  const cart = setup({ guestItems: [line()] });
  cart.replies.products.push(() => Promise.reject(new Error('offline')));
  cart.controller.start(guest);
  await cart.idle();
  assert.equal(cart.state().phase, 'error');
  cart.controller.retry();
  await cart.idle();
  assert.equal(cart.state().phase, 'ready');
  assert.equal(cart.state().cart.items.length, 1);
});

test('guest write failure reports and rebuilds', async () => {
  const cart = await startedGuest({ guestItems: [line()] });
  const real = cart.local.write;
  cart.local.write = () => { throw new Error('QuotaExceededError'); };
  assert.equal(cart.controller.adjustQuantity(I1, 1), false);
  await cart.idle();
  cart.local.write = real;
  assert.deepEqual(cart.notes.error, ['장바구니를 저장하지 못했습니다.']);
  assert.equal(cart.state().cart.items[0].quantity, 1);
  assert.equal(cart.calls.products.length, 2);
});

test('guest cleanup saves and reports adjusted and unavailable items', async () => {
  const cart = await startedGuest({ guestItems: [line({ quantity: 5 }), line({ id: I2, productId: 9, variantId: 9 })], products: [product({ stock: 3 })] });
  assert.deepEqual(cart.local.read().items, [line({ quantity: 3 })]);
  assert.deepEqual(cart.notes.info, ['현재 재고에 맞게 수량을 조정했습니다.', '현재 이용할 수 없는 상품을 장바구니에서 제외했습니다.']);
});

test('guest entry detects login and merges', async () => {
  const cart = await startedGuest({ guestItems: [line()] });
  cart.replies.access.push(member());
  cart.controller.enterCart();
  assert.equal(cart.state().busy, true);
  await cart.idle();
  assert.equal(cart.calls.access, 1);
  assert.deepEqual(cart.state().access, member());
  assert.equal(cart.calls.mutate[0].operation.kind, 'merge_guest');
  assert.deepEqual(cart.local.read().items, []);
});

test('guest entry keeps guest view when access check fails', async () => {
  const cart = await startedGuest({ guestItems: [line()] });
  cart.replies.access.push(() => Promise.reject(new Error('offline')));
  cart.controller.enterCart();
  await cart.idle();
  assert.deepEqual(cart.state().access, guest);
  assert.equal(cart.state().phase, 'ready');
  assert.equal(cart.state().cart.items.length, 1);
});

// --- review fixes ---

test('a malformed member read reply becomes a load error, not a silent hang', async () => {
  const cart = setup();
  cart.replies.read.push({ status: 'ok', cart: {} });
  cart.controller.start(member());
  await cart.idle();
  assert.deepEqual([cart.state().phase, cart.state().message, cart.state().busy], ['error', '장바구니를 불러오지 못했습니다.', false]);
});

test('member replies with an invalid line are handled as lost replies', async () => {
  const lines = [{ quantity: 0 }, { id: 'not-a-uuid' }, { canSelect: undefined }, { price: -1 }];
  for (const broken of lines) {
    const cart = setup();
    cart.replies.read.push({ status: 'ok', cart: cartView({ items: [{ ...cartView().items[0], ...broken }] }) });
    cart.controller.start(member());
    await cart.idle();
    assert.deepEqual([cart.state().phase, cart.state().cart], ['error', null], JSON.stringify(broken));
  }
});

test('a malformed add reply re-reads, clears pending adds and reports failure', async () => {
  const cart = await startedMember();
  // Owner and operation match, but items, notices and option groups are missing.
  cart.replies.mutate.push(() => ({ status: 'ok', cart: { owner: { kind: 'member', userId: A }, operation: { requestId: cart.calls.mutate.at(-1).requestId, outcome: 'applied', itemIdMap: {}, notices: [] } } }));
  assert.equal(cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 3 }]), true);
  await cart.idle();
  assert.equal(cart.state().pendingAdd, 0);
  assert.equal(cart.calls.read.length, 2);
  assert.equal(cart.state().cart.items.length, 1);
  assert.deepEqual(cart.notes.error, ['장바구니에 담지 못했습니다.']);
});

test('an unexpected error inside a flow resets pending adds and reports it', async () => {
  const cart = await startedMember();
  cart.replies.mutate.push(() => ({ get status() { throw new Error('boom'); } }));
  cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 3 }]);
  await cart.idle();
  assert.equal(cart.state().pendingAdd, 0);
  assert.equal(cart.state().busy, false);
  assert.ok(cart.notes.error.length >= 1);
});

test('an unexpected error after the cart is shown keeps the last server cart on screen', async () => {
  const cart = await startedMember();
  cart.replies.mutate.push({ status: 'retryable', message: 'x' });
  const original = cart.notes.error.push.bind(cart.notes.error);
  let thrown = false;
  cart.notes.error.push = message => { if (!thrown) { thrown = true; throw new Error('toast failed'); } return original(message); };
  assert.equal(cart.controller.adjustQuantity(I1, 1), true);
  await cart.idle();
  assert.equal(thrown, true);
  assert.deepEqual([cart.state().phase, cart.state().busy, cart.state().cart.items[0].quantity], ['ready', false, 2]);
  assert.deepEqual([...cart.notes.error], ['장바구니를 불러오지 못했습니다.']);
});

test('a failed member removal brings the line back unselected', async () => {
  const cart = await startedMember();
  cart.store.getState().setSelected(I1, true);
  cart.replies.mutate.push({ status: 'retryable', message: 'x' });
  cart.controller.removeItems([I1]);
  assert.deepEqual(cart.state().selectedIds, []);
  await cart.idle();
  assert.deepEqual(cart.state().cart.items.map(item => item.id), [I1]);
  assert.deepEqual(cart.state().selectedIds, []);
});

test('a guest option change that merges into another line keeps the selection on that line', async () => {
  const cart = await startedGuest({ guestItems: [line(), line({ id: I2, variantId: 3 })], products: [product(), product({ variantId: 3, size: 'L' })] });
  cart.store.getState().setSelected(I1, true);
  assert.equal(cart.controller.changeOption(I1, 1, 3), true);
  await cart.idle();
  assert.deepEqual(cart.state().cart.items.map(item => item.id), [I2]);
  assert.deepEqual(cart.state().selectedIds, [I2]);
});

test('guest start without browser storage reports a load failure, not a save failure', async () => {
  const cart = setup({ storage: null });
  cart.controller.start(guest);
  await cart.idle();
  assert.deepEqual([cart.state().phase, cart.state().message], ['error', '장바구니 정보를 불러오지 못했습니다.']);
  assert.deepEqual(cart.notes.error, ['장바구니 정보를 불러오지 못했습니다.']);
});

test('adds with a non-integer quantity are refused before any request', async () => {
  const cart = await startedMember();
  assert.equal(cart.controller.addItems([{ productId: 1, variantId: 2, quantity: 1.5 }]), false);
  assert.equal(cart.controller.addItems([{ productId: 1, variantId: 2, quantity: Infinity }]), false);
  assert.equal(cart.calls.mutate.length, 0);
  assert.equal(cart.state().pendingAdd, 0);
});

// --- PR review ---

test('a rejected merge reports one reason, not the server notice as well', async () => {
  const cart = setup({ guestItems: [line()] });
  cart.replies.mutate.push(() => okFor(cart.calls.mutate[0], cartView({ notices: [{ kind: 'unavailable', variantId: 2, before: 1, after: 0 }] }), 'rejected'));
  cart.controller.start(member());
  await cart.idle();
  assert.deepEqual(cart.notes.info, []);
  assert.deepEqual(cart.notes.error, ['판매하지 않는 상품이라 옮기지 못했습니다.']);
});

test('a guest change after storage became unreadable reports one save failure', async () => {
  const cart = await startedGuest({ guestItems: [line()] });
  cart.local.read = () => { throw new Error('CART_LOCAL_UNAVAILABLE'); };
  assert.equal(cart.controller.adjustQuantity(I1, 1), false);
  await cart.idle();
  assert.deepEqual(cart.notes.error, ['장바구니를 저장하지 못했습니다.']);
  assert.equal(cart.state().phase, 'error');
});

test('an access error start recovers through retry', async () => {
  const cart = setup();
  cart.controller.start({ status: 'error', message: '확인 실패' });
  assert.deepEqual([cart.state().phase, cart.state().message], ['error', '확인 실패']);
  cart.replies.access.push(member());
  cart.controller.retry();
  await cart.idle();
  assert.equal(cart.calls.access, 1);
  assert.deepEqual(cart.state().access, member());
  assert.equal(cart.state().phase, 'ready');
});

test('guest rebuild gives up after three loads when another tab keeps saving', async () => {
  const cart = setup({ guestItems: [line()] });
  let quantity = 1;
  for (let n = 0; n < 5; n++) cart.replies.products.push(() => { cart.local.write([line({ quantity: ++quantity })]); return productResponse([product()]); });
  cart.controller.start(guest);
  await cart.idle();
  assert.equal(cart.calls.products.length, 3);
  assert.deepEqual([cart.state().phase, cart.state().message], ['error', '장바구니 정보를 불러오지 못했습니다.']);
  assert.deepEqual(cart.local.read().items, [line({ quantity: 4 })]);
});

test('guest rebuild uses the newer lines another tab saved during the load', async () => {
  const cart = setup({ guestItems: [line()] });
  cart.replies.products.push(() => { cart.local.write([line({ quantity: 3 })]); return productResponse([product()]); });
  cart.controller.start(guest);
  await cart.idle();
  assert.equal(cart.calls.products.length, 2);
  assert.equal(cart.state().cart.items[0].quantity, 3);
});

test('guest cart entry that finds a restricted account restarts as restricted', async () => {
  const cart = await startedGuest({ guestItems: [line()] });
  cart.replies.access.push({ status: 'restricted', reason: 'unverified' });
  cart.controller.enterCart();
  await cart.idle();
  assert.deepEqual([cart.state().phase, cart.state().cart, cart.state().message], ['restricted', null, '이메일 인증과 회원 상태를 확인해주세요.']);
  assert.equal(cart.calls.mutate.length, 0);
  assert.deepEqual(cart.local.read().items, [line()]);
});
