import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createClient } from '@supabase/supabase-js';
import { loadTs } from './helpers/load-ts.mjs';
import { A, B, REQUEST1, cartDto, command } from './helpers/cart-fixtures.mjs';

function setup({ data = cartDto(), error, token = 'session-A' } = {}) {
  const requests = [];
  const client = createClient('https://cart-test.supabase.co', 'test-anon-key', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` }, fetch: async (input, options) => {
      requests.push({ url: new URL(String(input)), method: options.method,
        headers: new Headers(options.headers), body: JSON.parse(options.body) });
      return new Response(JSON.stringify(error ?? data), {
        status: error ? 400 : 200, headers: { 'content-type': 'application/json' },
      });
    } },
  });
  const { createCartRepository } = loadTs('src/domains/cart/repository.ts');
  return { requests, repository: createCartRepository(client) };
}

test('session repository calls the two real SDK RPC boundaries with fixed command content', async () => {
  const read = setup({ data: cartDto({ revision: '9007199254740993' }) });
  assert.equal((await read.repository.read(A)).revision, '9007199254740993');
  assert.equal(read.requests[0].url.pathname, '/rest/v1/rpc/get_cart');
  assert.equal(read.requests[0].method, 'POST');
  assert.deepEqual(read.requests[0].body, { p_expected_user_id: A });
  const receipt = { requestId: REQUEST1, outcome: 'applied', itemIdMap: {}, notices: [] };
  const write = setup({ data: cartDto({ operation: receipt }) });
  assert.deepEqual((await write.repository.apply(command())).operation, receipt);
  assert.equal(write.requests[0].url.pathname, '/rest/v1/rpc/apply_cart_operation');
  assert.deepEqual(write.requests[0].body, {
    p_expected_user_id: A, p_request_id: REQUEST1,
    p_operation: { version: 1, operation: command().operation },
  });
});

test('repository instances keep the supplied session and owner separate', async () => {
  const alice = setup();
  const bob = setup({ data: cartDto({ owner_id: B }), token: 'session-B' });
  assert.equal((await alice.repository.read(A)).owner_id, A);
  assert.equal((await bob.repository.read(B)).owner_id, B);
  assert.equal(alice.requests[0].headers.get('authorization'), 'Bearer session-A');
  assert.equal(bob.requests[0].headers.get('authorization'), 'Bearer session-B');
  assert.deepEqual(bob.requests[0].body, { p_expected_user_id: B });
});

test('repository rejects malformed, wrong-owner and unconfirmed mutation responses', async () => {
  for (const data of [null, {}, cartDto({ revision: 2 }), cartDto({ owner_id: B })]) {
    await assert.rejects(setup({ data }).repository.read(A));
  }
  for (const operation of [null, { requestId: '20000000-0000-4000-8000-000000000002', outcome: 'applied', itemIdMap: {}, notices: [] }]) {
    await assert.rejects(setup({ data: cartDto({ operation }) }).repository.apply(command()));
  }
  await assert.rejects(setup({ data: cartDto({ operation: {
    requestId: REQUEST1, outcome: 'noop', itemIdMap: {}, notices: [],
  } }) }).repository.read(A));
});

test('repository classifies only recognized RPC failures and hides database diagnostics', async () => {
  for (const [error, kind] of [
    [{ code: 'P0001', message: 'CART_REQUEST_CONFLICT' }, 'conflict'],
    [{ code: '42501', message: 'CART_ACCESS_DENIED' }, 'access_changed'],
    [{ code: '22023', message: 'CART_INVALID_OPERATION' }, 'invalid'],
    [{ code: '42501', message: 'PRIVATE_SCHEMA_DETAIL' }, 'retryable'],
    [{ code: 'P0001', message: 'PRIVATE_TRIGGER_DETAIL' }, 'retryable'],
  ]) await assert.rejects(setup({ error }).repository.apply(command()), failure => {
    assert.equal(failure.kind, kind);
    assert.doesNotMatch(failure.message, /PRIVATE_|CART_ACCESS_DENIED|CART_REQUEST_CONFLICT/);
    return true;
  });
});

test('invalid repository input never reaches the SDK fetch boundary', async () => {
  const { repository, requests } = setup();
  await assert.rejects(repository.read('bad'));
  await assert.rejects(repository.apply(command({ requestId: 'bad' })));
  assert.equal(requests.length, 0);
});
