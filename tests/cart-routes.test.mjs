import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, cartView, command } from './helpers/cart-fixtures.mjs';

const ORIGIN = 'https://shop.example';
const LIMIT = 1_048_576;

// Route Handlers run as real modules; only the server composition functions are replaced.
function routes({ access = { status: 'member', userId: A }, reply } = {}) {
  const calls = { access: 0, read: [], mutate: [] };
  const server = {
    resolveCartAccess: async () => { calls.access++; return access; },
    readCart: async input => { calls.read.push(input); return reply ?? { status: 'ok', cart: cartView() }; },
    mutateCart: async input => { calls.mutate.push(input); return reply ?? { status: 'ok', cart: cartView() }; },
  };
  const mocks = { '@/app/cart-actions': server };
  return {
    calls,
    access: loadTs('src/app/api/cart/access/route.ts', mocks),
    read: loadTs('src/app/api/cart/read/route.ts', mocks),
    operations: loadTs('src/app/api/cart/operations/route.ts', mocks),
  };
}

function post(body, options = {}) {
  const { host = 'shop.example', forwardedHost, site = 'same-origin', type = 'application/json', url = 'http://internal:3000/api/cart/read' } = options;
  // An explicit `origin: undefined` omits the header instead of using the default.
  const origin = 'origin' in options ? options.origin : ORIGIN;
  const headers = new Headers();
  if (origin !== undefined) headers.set('origin', origin);
  if (host) headers.set('host', host);
  if (forwardedHost) headers.set('x-forwarded-host', forwardedHost);
  if (site) headers.set('sec-fetch-site', site);
  if (type) headers.set('content-type', type);
  return new Request(url, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
}

async function json(response) {
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);
  return response.json();
}

test('access GET returns CartAccess JSON with no-store, including a 200 error access', async () => {
  for (const access of [{ status: 'member', userId: A }, { status: 'guest' }, { status: 'error', message: '다시 시도' }]) {
    const { access: route } = routes({ access });
    const response = await route.GET(new Request('http://internal/api/cart/access'));
    assert.equal(response.status, 200);
    assert.deepEqual(await json(response), access);
  }
});

test('read and operations POST pass the parsed body to the server functions and map reply statuses', async () => {
  for (const [reply, status] of [
    [{ status: 'ok', cart: cartView() }, 200],
    [{ status: 'access_changed', access: { status: 'guest' } }, 200],
    [{ status: 'invalid', message: '형식' }, 400],
    [{ status: 'conflict', message: '충돌' }, 409],
    [{ status: 'retryable', message: '재시도' }, 503],
  ]) {
    const { read, operations, calls } = routes({ reply });
    const readResponse = await read.POST(post({ expectedUserId: A }));
    assert.equal(readResponse.status, status);
    assert.deepEqual(await json(readResponse), reply);
    const original = command();
    const opResponse = await operations.POST(post(original));
    assert.equal(opResponse.status, status);
    assert.deepEqual(await json(opResponse), reply);
    assert.deepEqual(calls.read, [{ expectedUserId: A }]);
    assert.deepEqual(calls.mutate, [original]);
  }
});

test('origin is compared with x-forwarded-host or host, never with the internal request URL', async () => {
  const { read, calls } = routes();
  assert.equal((await read.POST(post({ expectedUserId: A }, { host: 'internal:3000', forwardedHost: 'shop.example, proxy.local' }))).status, 200);
  assert.equal((await read.POST(post({ expectedUserId: A }, { host: 'shop.example' }))).status, 200);
  assert.equal(calls.read.length, 2);
});

test('missing, null, mismatched or cross-site origins are rejected with 403 invalid before server work', async () => {
  for (const options of [
    { origin: undefined }, { origin: 'null' }, { origin: 'https://evil.example' },
    { origin: 'https://shop.example.evil' }, { site: 'same-site' }, { site: 'cross-site' },
    { origin: 'not a url' },
  ]) {
    const { read, operations, calls } = routes();
    for (const route of [read, operations]) {
      const response = await route.POST(post({ expectedUserId: A }, options));
      assert.equal(response.status, 403);
      assert.equal((await json(response)).status, 'invalid');
    }
    assert.equal(calls.read.length + calls.mutate.length + calls.access, 0);
  }
});

test('non-JSON content and malformed JSON are 400 invalid without server work', async () => {
  const { read, calls } = routes();
  for (const request of [post({ expectedUserId: A }, { type: 'text/plain' }), post('{"expectedUserId":', {})]) {
    const response = await read.POST(request);
    assert.equal(response.status, 400);
    assert.equal((await json(response)).status, 'invalid');
  }
  assert.equal(calls.read.length, 0);
});

test('the body limit is enforced on the actual bytes, not on Content-Length', async () => {
  const { read, calls } = routes();
  const pad = 'x'.repeat(LIMIT);
  const oversized = post(JSON.stringify({ expectedUserId: A, pad }));
  oversized.headers.set('content-length', '10');
  const response = await read.POST(oversized);
  assert.equal(response.status, 413);
  assert.equal((await json(response)).status, 'invalid');
  const fits = JSON.stringify({ expectedUserId: A, pad: 'x'.repeat(LIMIT - 100) });
  assert.ok(Buffer.byteLength(fits) <= LIMIT);
  assert.equal((await read.POST(post(fits))).status, 200);
  assert.equal(calls.read.length, 1);
});
