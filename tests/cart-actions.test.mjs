import assert from 'node:assert/strict';
import { test } from 'node:test';
import { redirect } from 'next/navigation.js';
import { loadTs } from './helpers/load-ts.mjs';
import { A, B, cartDto, command, productModel } from './helpers/cart-fixtures.mjs';

function setup({ access = [{ status: 'active', member: { id: A } }], repositoryError, ordinaryError, clientError, accessError, missingProduct = false } = {}) {
  const calls = { access: 0, clients: [], repositories: [], read: [], apply: [] };
  const contract = loadTs('src/domains/cart/cart.repository.ts');
  const actions = loadTs('src/app/cart-actions.ts', {
    '@/domains/cart/cart.repository': contract,
    '@/domains/auth/member-access.server': { getCurrentMemberAccess: async () => {
      if (accessError) throw accessError;
      return access[Math.min(calls.access++, access.length - 1)];
    } },
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => {
      if (clientError) throw clientError;
      const client = { session: calls.clients.length + 1 };
      calls.clients.push(client); return client;
    } },
    '@/domains/cart/cart.supabase-repository.server': { createCartRepository: client => {
      calls.repositories.push(client);
      const fail = () => {
        if (repositoryError) throw new contract.CartRepositoryError(repositoryError);
        if (ordinaryError) throw ordinaryError;
      };
      return {
        read: async user => { calls.read.push(user); fail(); return cartDto(); },
        apply: async input => { calls.apply.push(input); fail(); return cartDto({ operation: { requestId: input.requestId, outcome: 'applied', itemIdMap: {}, notices: [] } }); },
      };
    } },
    '@/domains/product': { productService: {
      findByIds: async () => missingProduct ? [] : [productModel()],
      findByStyleId: async () => [productModel()],
    } },
  });
  return { actions, calls };
}

test('access resolution returns only cart identity and preserves every auth restriction/error', async () => {
  for (const [access, expected] of [
    [{ status: 'active', member: { id: A, email: 'PRIVATE_PROFILE' } }, { status: 'member', userId: A }],
    [{ status: 'unauthenticated' }, { status: 'guest' }],
    [{ status: 'unverified', email: 'PRIVATE_EMAIL' }, { status: 'restricted', reason: 'unverified' }],
    [{ status: 'unavailable' }, { status: 'restricted', reason: 'unavailable' }],
    [{ status: 'missing' }, { status: 'restricted', reason: 'missing' }],
  ]) assert.deepEqual(await setup({ access: [access] }).actions.resolveCartAccess(), expected);
  const { actions } = setup({ access: [{ status: 'error' }] });
  assert.equal((await actions.resolveCartAccess()).status, 'error');
});

test('invalid action input is rejected before access checks, clients or repository calls', async () => {
  const { actions, calls } = setup();
  assert.equal((await actions.readCart({ expectedUserId: 'bad' })).status, 'invalid');
  assert.equal((await actions.mutateCart(command({ version: 2 }))).status, 'invalid');
  assert.equal(calls.access, 0);
  assert.equal(calls.clients.length, 0);
  assert.equal(calls.repositories.length, 0);
});

test('guest, restricted and another actual account cannot execute an expected-account command', async () => {
  for (const access of [
    { status: 'unauthenticated' }, { status: 'unverified', email: 'hidden' },
    { status: 'missing' }, { status: 'unavailable' }, { status: 'active', member: { id: B } },
  ]) {
    const { actions, calls } = setup({ access: [access] });
    assert.equal((await actions.mutateCart(command())).status, 'access_changed');
    assert.equal((await actions.readCart({ expectedUserId: A })).status, 'access_changed');
    assert.equal(calls.clients.length, 0);
    assert.equal(calls.repositories.length, 0);
  }
});

test('successful actions compose a new session repository per call and return product view models', async () => {
  const { actions, calls } = setup();
  const read = await actions.readCart({ expectedUserId: A });
  const changed = await actions.mutateCart(command());
  assert.equal(read.status, 'ok');
  assert.equal(read.cart.items[0].canSelect, true);
  assert.equal(changed.status, 'ok');
  assert.equal(changed.cart.operation.outcome, 'applied');
  assert.equal(calls.clients.length, 2);
  assert.notEqual(calls.clients[0], calls.clients[1]);
  assert.deepEqual(calls.repositories, calls.clients);
  assert.deepEqual(calls.apply, [command()]);
});

test('temporary auth failure is retryable and cannot become a guest or initialize a cart', async () => {
  for (const config of [{ access: [{ status: 'error' }] }, { accessError: new Error('PRIVATE_AUTH_DETAIL') }]) {
    const { actions, calls } = setup(config);
    assert.equal((await actions.resolveCartAccess()).status, 'error');
    const result = await actions.mutateCart(command());
    assert.equal(result.status, 'retryable');
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_/);
    assert.equal(calls.clients.length, 0);
  }
});

test('RPC failures distinguish request conflict/invalid input and recheck access after DB denial', async () => {
  for (const kind of ['conflict', 'invalid', 'retryable']) {
    const result = await setup({ repositoryError: kind }).actions.mutateCart(command());
    assert.equal(result.status, kind);
    assert.doesNotMatch(JSON.stringify(result), /CART_|PRIVATE_/);
  }
  const { actions, calls } = setup({ repositoryError: 'access_changed', access: [
    { status: 'active', member: { id: A } }, { status: 'active', member: { id: B } },
  ] });
  assert.deepEqual(await actions.mutateCart(command()), { status: 'access_changed', access: { status: 'member', userId: B } });
  assert.equal(calls.access, 2);
  assert.equal(calls.apply.length, 1);
});

test('a database refusal for the member the session still confirms is retryable, not an account change', async () => {
  // The session check and the cart RPC disagree (e.g. users.email_verified_at drifted): restarting would loop forever.
  const { actions, calls } = setup({ repositoryError: 'access_changed' });
  const reply = await actions.mutateCart(command());
  assert.equal(reply.status, 'retryable');
  assert.equal(calls.access, 2);
  assert.equal((await setup({ repositoryError: 'access_changed' }).actions.readCart({ expectedUserId: A })).status, 'retryable');
});

test('database, client and persistent display failures return safe retryable replies', async () => {
  for (const config of [
    { ordinaryError: new Error('PRIVATE_DB_DETAIL') }, { clientError: new Error('PRIVATE_COOKIE_DETAIL') }, { missingProduct: true },
  ]) {
    const { actions } = setup(config);
    const result = await actions.mutateCart(command());
    assert.equal(result.status, 'retryable');
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE_/);
  }
});

test('Next control-flow exceptions escape both access resolution and mutation handling', async () => {
  let control;
  try { redirect('/login'); } catch (error) { control = error; }
  assert.ok(control);
  const access = setup({ accessError: control });
  await assert.rejects(access.actions.resolveCartAccess(), error => error === control);
  await assert.rejects(setup({ ordinaryError: control }).actions.mutateCart(command()), error => error === control);
});

test('cart server composition is a server-only module without Server Action exports', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../src/app/cart-actions.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /['"]use server['"]/);
  assert.match(source, /^import 'server-only';/m);
  const exported = Object.keys(setup().actions).sort();
  assert.deepEqual(exported, ['mutateCart', 'readCart', 'resolveCartAccess']);
});
