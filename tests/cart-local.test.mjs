import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, B, I1, I2, REQUEST1, command } from './helpers/cart-fixtures.mjs';

const KEY = 'bang-cart:v1';
const REQUEST2 = '20000000-0000-4000-8000-000000000002';
const REQUEST3 = '20000000-0000-4000-8000-000000000003';
const line = (overrides = {}) => ({ id: I1, productId: 1, variantId: 2, quantity: 3, ...overrides });
const emptyDocument = () => ({ version: 1, authEpoch: 0, guest: { revision: 0, items: [] }, pendingByAccount: {} });
const localModule = () => loadTs('src/domains/cart/cart.local.ts');

// These boundaries model atomic Storage writes and the same-origin exclusive lock.
// All document validation and transitions execute the production adapter.
function environment(initial = null) {
  let stored = initial;
  let failure = null;
  let tail = Promise.resolve();
  let held = false;
  let writes = 0;
  let ids = 0;
  const listeners = new Set();
  const storage = {
    getItem(key) {
      assert.equal(key, KEY);
      assert.equal(held, true, 'read latest storage only inside the shared lock');
      if (failure === 'read') throw new Error('Storage access denied');
      return stored;
    },
    setItem(key, value) {
      assert.equal(key, KEY);
      assert.equal(held, true, 'all writes must hold the shared lock');
      if (failure === 'write') throw new DOMException('Storage is full', 'QuotaExceededError');
      stored = value;
      writes++;
    },
  };
  const locks = {
    request(name, callback) {
      assert.equal(name, 'bang-cart:local');
      const result = tail.then(async () => {
        assert.equal(held, false);
        held = true;
        try { return await callback(); }
        finally { held = false; }
      });
      tail = result.catch(() => {});
      return result;
    },
  };
  const events = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  const newId = () => [REQUEST1, REQUEST2, REQUEST3][ids++];
  return {
    storage, locks, events, newId,
    adapter(overrides = {}) { return localModule().createCartLocalAdapter({ storage, locks, events, newId, ...overrides }); },
    raw: () => stored,
    writes: () => writes,
    ids: () => ids,
    held: () => held,
    fail: value => { failure = value; },
    replace: value => { stored = value; },
    emit: event => { for (const listener of listeners) listener(event); },
  };
}

test('local restore is lazy, starts empty without writing and returns isolated copies', async () => {
  const { createCartLocalAdapter } = localModule();
  assert.doesNotThrow(() => createCartLocalAdapter()); // no browser globals during creation
  const env = environment();
  const local = env.adapter();
  const first = await local.read();
  assert.deepEqual(first, emptyDocument());
  first.guest.items.push(line());
  assert.deepEqual(await local.read(), emptyDocument());
  assert.equal(env.raw(), null);
  assert.equal(env.writes(), 0);
});

test('two tabs compare guest revisions under the lock instead of overwriting newer items', async () => {
  const env = environment();
  const localA = env.adapter();
  const localB = env.adapter();
  const input = [line()];
  const first = localA.updateGuest(0, input);
  input[0].quantity = 99; // waiting for the lock must not change the captured request
  const results = await Promise.all([first, localB.updateGuest(0, [line({ id: I2, variantId: 17 })])]);
  assert.deepEqual(results, ['saved', 'stale']);
  assert.deepEqual((await localB.read()).guest, { revision: 1, items: [line()] });
  assert.equal(env.writes(), 1);
  const restored = env.adapter();
  assert.deepEqual((await restored.read()).guest.items, [line()]);
});

test('concurrent login migration stages one fixed request and clears guest in a single write', async () => {
  const env = environment();
  const localA = env.adapter();
  const localB = env.adapter();
  await localA.updateGuest(0, [line()]);
  const beforeWrites = env.writes();
  const replies = await Promise.all([localA.stageMerge(A), localB.stageMerge(A)]);
  assert.deepEqual(replies, [command({ operation: { kind: 'merge_guest', items: [{ productId: 1, variantId: 2, quantity: 3 }] } }), null]);
  const saved = await localA.read();
  assert.deepEqual(saved.guest, { revision: 2, items: [] });
  assert.deepEqual(saved.pendingByAccount[A], [replies[0]]);
  assert.equal(env.writes() - beforeWrites, 1);
  assert.equal(env.ids(), 1);
  replies[0].operation.items[0].quantity = 99;
  assert.equal((await localB.peek(A)).operation.items[0].quantity, 3);
});

test('migration appends behind prior account requests and restores the same FIFO after reload', async () => {
  const env = environment();
  const local = env.adapter({ newId: () => REQUEST2 });
  const earlier = command();
  await local.enqueue(earlier);
  await local.updateGuest(0, [line()]);
  const merge = await local.stageMerge(A);
  assert.equal(merge.requestId, REQUEST2);
  assert.deepEqual((await local.read()).pendingByAccount[A], [earlier, merge]);
  assert.deepEqual(await env.adapter().peek(A), earlier);
  await local.ack(earlier);
  assert.deepEqual(await env.adapter().peek(A), merge);
  assert.equal(await local.stageMerge(A), null);
});

test('enqueue preserves fixed content, deduplicates retries and blocks new uncertain member changes', async () => {
  const env = environment();
  const local = env.adapter();
  const input = command();
  const enqueue = local.enqueue(input);
  input.operation.delta = -1;
  await enqueue;
  assert.deepEqual(await local.peek(A), command());
  const original = env.raw();
  await local.enqueue(command());
  assert.equal(env.raw(), original);
  assert.equal(env.writes(), 1);
  await assert.rejects(local.enqueue(command({ requestId: REQUEST2 })), /CART_LOCAL_PENDING/);
  await assert.rejects(local.enqueue(command({ operation: { kind: 'adjust_quantity', itemId: I1, delta: -1 } })), /CART_LOCAL_CONFLICT/);
  assert.equal(env.raw(), original);
  await local.enqueue(command({ expectedUserId: B })); // same request UUID on another account is independent
  assert.deepEqual(await local.peek(B), command({ expectedUserId: B }));
});

test('ack removes only the exact account, ID and content without touching new guests or later requests', async () => {
  const env = environment();
  const local = env.adapter({ newId: () => REQUEST2 });
  await local.enqueue(command());
  await local.enqueue(command({ expectedUserId: B }));
  await local.updateGuest(0, [line()]);
  const later = await local.stageMerge(A);
  await local.updateGuest(2, [line({ id: I2, quantity: 1 })]);
  const before = env.raw();
  await assert.rejects(local.ack(command({ operation: { kind: 'adjust_quantity', itemId: I1, delta: -1 } })), /CART_LOCAL_CONFLICT/);
  assert.equal(env.raw(), before);
  await local.ack(command({ requestId: REQUEST3 })); // missing ID is harmless
  assert.equal(env.raw(), before);
  await local.ack(command());
  const after = await local.read();
  assert.deepEqual(after.pendingByAccount[A], [later]);
  assert.deepEqual(after.pendingByAccount[B], [command({ expectedUserId: B })]);
  assert.deepEqual(after.guest, { revision: 3, items: [line({ id: I2, quantity: 1 })] });
  await local.ack(command()); // stale response cannot acknowledge the next request
  assert.deepEqual(await local.peek(A), later);
  await local.ack(later);
  assert.equal(await local.peek(A), null);
  assert.deepEqual(await local.peek(B), command({ expectedUserId: B }));
});

test('quota failure preserves guest and pending bytes, then recovery uses the existing snapshot', async () => {
  const env = environment();
  const local = env.adapter();
  await local.enqueue(command({ expectedUserId: B }));
  await local.updateGuest(0, [line()]);
  const original = env.raw();
  env.fail('write');
  await assert.rejects(local.stageMerge(A), error => error.name === 'QuotaExceededError');
  assert.equal(env.raw(), original);
  env.fail(null);
  const merged = await local.stageMerge(A);
  assert.equal(merged.requestId, REQUEST2);
  assert.deepEqual(merged.operation.items, [{ productId: 1, variantId: 2, quantity: 3 }]);
  assert.deepEqual(await local.peek(B), command({ expectedUserId: B }));
});

test('every failed local write keeps the previously durable document and pending request', async () => {
  const env = environment();
  const local = env.adapter();
  await local.enqueue(command());
  const original = env.raw();
  env.fail('write');
  await assert.rejects(local.ack(command()), { name: 'QuotaExceededError' });
  await assert.rejects(local.updateGuest(0, [line()]), { name: 'QuotaExceededError' });
  await assert.rejects(local.enqueue(command({ expectedUserId: B })), { name: 'QuotaExceededError' });
  await assert.rejects(local.announceAuthTransition(), { name: 'QuotaExceededError' });
  assert.equal(env.raw(), original);
  env.fail(null);
  assert.deepEqual(await env.adapter().peek(A), command());
});

test('corrupt, unsupported and structurally invalid documents are never reset or partially overwritten', async () => {
  const wrongOwner = emptyDocument();
  wrongOwner.pendingByAccount[A] = [command({ expectedUserId: B })];
  const duplicate = emptyDocument();
  duplicate.pendingByAccount[A] = [command(), command()];
  const malformed = [
    '{', '', 'null', '[]',
    JSON.stringify({ ...emptyDocument(), version: 2 }),
    JSON.stringify({ ...emptyDocument(), schemaVersion: 1 }),
    JSON.stringify({ ...emptyDocument(), authEpoch: -1 }),
    JSON.stringify({ ...emptyDocument(), guest: { revision: 0, items: [line({ quantity: 1.5 })] } }),
    JSON.stringify({ ...emptyDocument(), guest: { revision: 0, items: [line({ price: 100 })] } }),
    JSON.stringify({ ...emptyDocument(), guest: { revision: 0, items: [line(), line()] } }),
    JSON.stringify(wrongOwner), JSON.stringify(duplicate),
  ];
  for (const original of malformed) {
    const env = environment(original);
    const local = env.adapter();
    for (const action of [
      () => local.read(), () => local.updateGuest(0, []), () => local.stageMerge(A),
      () => local.enqueue(command()), () => local.peek(A), () => local.ack(command()),
      () => local.announceAuthTransition(),
    ]) await assert.rejects(action());
    assert.equal(env.raw(), original);
    assert.equal(env.writes(), 0);
  }
});

test('missing locks and inaccessible storage fail without an unsafe write fallback', async () => {
  const env = environment();
  const missingLocks = env.adapter({ locks: null });
  for (const action of [
    () => missingLocks.read(), () => missingLocks.updateGuest(0, [line()]),
    () => missingLocks.stageMerge(A), () => missingLocks.enqueue(command()),
    () => missingLocks.peek(A), () => missingLocks.ack(command()),
    () => missingLocks.announceAuthTransition(),
  ]) await assert.rejects(action(), /CART_LOCAL_UNAVAILABLE/);
  assert.equal(env.writes(), 0);
  assert.equal(env.raw(), null);
  const local = env.adapter();
  await local.updateGuest(0, [line()]);
  const original = env.raw();
  env.fail('read');
  await assert.rejects(local.stageMerge(A), /Storage access denied/);
  assert.equal(env.raw(), original);
});

test('invalid inputs, exhausted revisions and merge ID collisions preserve the durable original', async () => {
  const env = environment();
  const local = env.adapter({ newId: () => REQUEST1 });
  for (const quantity of [0, -1, 1.5, '2', 2147483648]) await assert.rejects(local.updateGuest(0, [line({ quantity })]));
  await assert.rejects(local.updateGuest(-1, []));
  await assert.rejects(local.stageMerge('bad'));
  await assert.rejects(local.enqueue(command({ requestId: 'bad' })));
  assert.equal(env.raw(), null);
  await local.enqueue(command());
  await local.updateGuest(0, [line()]);
  const original = env.raw();
  await assert.rejects(local.stageMerge(A), /CART_LOCAL_CONFLICT/);
  assert.equal(env.raw(), original);
  const exhausted = emptyDocument();
  exhausted.authEpoch = Number.MAX_SAFE_INTEGER;
  exhausted.guest.revision = Number.MAX_SAFE_INTEGER;
  env.replace(JSON.stringify(exhausted));
  await assert.rejects(local.updateGuest(Number.MAX_SAFE_INTEGER, [line()]));
  await assert.rejects(local.announceAuthTransition());
  assert.equal(env.raw(), JSON.stringify(exhausted));
});

test('merge validation failure cannot lose a guest snapshot whose combined quantity overflows', async () => {
  const document = emptyDocument();
  document.guest.items = [line({ quantity: 2147483647 }), line({ id: I2, quantity: 1 })];
  const original = JSON.stringify(document);
  const env = environment(original);
  await assert.rejects(env.adapter().stageMerge(A));
  assert.equal(env.raw(), original);
  assert.equal(env.writes(), 0);
});

test('auth transition increments only the signal epoch and never transfers account or guest data', async () => {
  const env = environment();
  const local = env.adapter();
  await local.enqueue(command());
  await local.updateGuest(0, [line()]);
  await Promise.all([local.announceAuthTransition(), env.adapter().announceAuthTransition()]);
  assert.deepEqual(await local.read(), {
    version: 1, authEpoch: 2, authPending: false, guest: { revision: 1, items: [line()] }, pendingByAccount: { [A]: [command()] },
  });
});

test('storage notifications invalidate only this local document and unsubscribe cleanly', () => {
  const env = environment();
  let count = 0;
  const unsubscribe = env.adapter().subscribe(() => { count++; });
  env.emit({ key: 'another-key', storageArea: env.storage });
  env.emit({ key: KEY, storageArea: {} }); // another storage area
  assert.equal(count, 0);
  env.emit({ key: KEY, storageArea: env.storage });
  env.emit({ key: null, storageArea: env.storage }); // Storage.clear invalidates a displayed snapshot
  assert.equal(count, 2);
  unsubscribe();
  env.emit({ key: KEY, storageArea: env.storage });
  assert.equal(count, 2);
  assert.equal(env.writes(), 0);
});

test('local lock is released before the caller waits for a server response', async () => {
  const env = environment();
  const local = env.adapter();
  await local.updateGuest(0, [line()]);
  const staged = await local.stageMerge(A);
  assert.equal(env.held(), false);
  let finishNetwork;
  const network = new Promise(resolve => { finishNetwork = resolve; });
  const completion = network.then(() => local.ack(staged));
  assert.equal(await env.adapter().updateGuest(2, [line({ id: I2 })]), 'saved');
  finishNetwork();
  await completion;
  assert.deepEqual((await local.read()).guest.items, [line({ id: I2 })]);
});

test('completing an auth transition succeeds only for the observed pending epoch and keeps account data', async () => {
  const env = environment();
  const local = env.adapter();
  await local.enqueue(command());
  await local.announceAuthTransition(true);
  const before = await local.read();
  assert.equal(await local.completeAuthTransition(before.authEpoch), true);
  const after = await local.read();
  assert.equal(after.authPending, false);
  assert.equal(after.authEpoch, before.authEpoch + 1);
  assert.deepEqual(after.pendingByAccount, before.pendingByAccount);
  assert.equal(await local.completeAuthTransition(after.authEpoch), false); // nothing pending
});

test('a newer transition started during a recheck is never released by the older epoch', async () => {
  const env = environment();
  const local = env.adapter();
  await local.enqueue(command());
  await local.announceAuthTransition(true);
  const before = await local.read();
  await local.announceAuthTransition(true); // 재확인 도중 더 새로운 전환
  const writes = env.writes();
  assert.equal(await local.completeAuthTransition(before.authEpoch), false);
  assert.equal(env.writes(), writes);
  assert.equal((await local.read()).authPending, true);
  assert.deepEqual((await local.read()).pendingByAccount, before.pendingByAccount);
});

test('an account-change notice advances the epoch but never releases another tab\'s pending transition', async () => {
  const env = environment();
  const local = env.adapter();
  assert.equal(await local.notifyAccountChange(), true);
  assert.deepEqual(await local.read(), { ...emptyDocument(), authEpoch: 1, authPending: false });
  await local.announceAuthTransition(true);
  const pending = await local.read();
  const writes = env.writes();
  assert.equal(await local.notifyAccountChange(), false);
  assert.equal(env.writes(), writes);
  assert.deepEqual(await local.read(), pending);
});

test('a merge resumed with an expected guest revision moves nothing once the guest cart changed', async () => {
  const env = environment();
  const local = env.adapter();
  await local.updateGuest(0, [line()]);
  await local.updateGuest(1, [line(), line({ id: I2, variantId: 4, quantity: 1 })]);
  const writes = env.writes();
  assert.equal(await local.stageMerge(A, 1), null);
  assert.equal(env.writes(), writes);
  assert.equal((await local.read()).guest.items.length, 2);
  assert.equal((await local.stageMerge(A, 2)).operation.kind, 'merge_guest');
});

test('a rejected merge is held for its account, never returned to the shared guest cart', async () => {
  const env = environment();
  const local = env.adapter();
  await local.updateGuest(0, [line(), line({ id: I2, variantId: 4, quantity: 1 })]);
  const merge = await local.stageMerge(A);
  assert.equal(await local.holdMerge(merge), true);
  const document = await local.read();
  assert.equal(document.pendingByAccount[A], undefined);
  assert.deepEqual(document.guest.items, []);
  assert.deepEqual(document.heldByAccount[A], [{ productId: 1, variantId: 2, quantity: 3 }, { productId: 1, variantId: 4, quantity: 1 }]);
  const writes = env.writes();
  assert.equal(await local.holdMerge(merge), false, 'a merge another tab already settled is not held twice');
  assert.equal(env.writes(), writes);
  assert.equal(await local.restageHeld(B), null);
  const retried = await local.restageHeld(A);
  assert.deepEqual(retried.operation, { kind: 'merge_guest', items: document.heldByAccount[A] });
  assert.equal((await local.read()).heldByAccount?.[A], undefined);
  assert.deepEqual(await local.peek(A), retried);
});
