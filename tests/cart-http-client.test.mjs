import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';
import { A, cartView, command } from './helpers/cart-fixtures.mjs';

// The real adapter runs against a recording fetch; only the network is replaced.
function client(respond, timeoutMs) {
  const sent = [];
  const fetcher = async (url, options) => {
    sent.push({ url, options });
    const result = await respond(url, options, sent.length);
    if (result instanceof Error) throw result;
    return result;
  };
  const { createCartHttpClient } = loadTs('src/features/cart/cart-http-client.ts');
  return { port: createCartHttpClient(fetcher, timeoutMs), sent };
}
// Never answers; settles only when the request is aborted.
const hang = (_, options) => new Promise((_, reject) => options?.signal?.addEventListener?.('abort', () => reject(options.signal.reason)));
const reply = (body, status = 200, type = 'application/json') =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'content-type': type } });

test('requests use relative same-origin URLs, JSON bodies and no Next-Action', async () => {
  const original = command();
  const { port, sent } = client(url => url === '/api/cart/access' ? reply({ status: 'member', userId: A }) : reply({ status: 'ok', cart: cartView() }));
  assert.deepEqual(await port.resolveAccess(), { status: 'member', userId: A });
  assert.equal((await port.read({ expectedUserId: A })).status, 'ok');
  assert.equal((await port.mutate(original)).status, 'ok');
  assert.deepEqual(sent.map(({ url, options }) => [url, options.method]), [
    ['/api/cart/access', 'GET'], ['/api/cart/read', 'POST'], ['/api/cart/operations', 'POST'],
  ]);
  for (const { options } of sent) {
    assert.equal(options.headers['Next-Action'], undefined);
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
  }
  assert.deepEqual(JSON.parse(sent[1].options.body), { expectedUserId: A });
  assert.deepEqual(JSON.parse(sent[2].options.body), original);
});

test('a replayed command is sent with the same requestId and content', async () => {
  const original = command();
  const { port, sent } = client((_, __, n) => n === 1 ? new TypeError('network lost') : reply({ status: 'ok', cart: cartView() }));
  assert.equal((await port.mutate(original)).status, 'retryable');
  assert.equal((await port.mutate(original)).status, 'ok');
  const [first, replayed] = sent.map(({ options }) => JSON.parse(options.body));
  assert.equal(replayed.requestId, original.requestId);
  assert.deepEqual(first, replayed);
});

test('contract JSON bodies of non-200 statuses reach the caller unchanged', async () => {
  for (const [body, status] of [
    [{ status: 'invalid', message: '형식' }, 400],
    [{ status: 'conflict', message: '충돌' }, 409],
    [{ status: 'retryable', message: '재시도' }, 503],
    [{ status: 'access_changed', access: { status: 'guest' } }, 200],
  ]) {
    const { port } = client(() => reply(body, status));
    assert.deepEqual(await port.mutate(command()), body);
  }
});

test('HTML, malformed JSON, wrong shapes, status mismatches, network failure and abort never become empty or guest', async () => {
  const failures = [
    () => reply('<html>login</html>', 200, 'text/html'),
    () => reply('{"status":', 200),
    () => reply({ status: 'ok' }, 200),
    () => reply({ status: 'ok', cart: cartView() }, 503),
    () => reply({ status: 'retryable', message: 'x' }, 200),
    () => reply({ status: 'conflict', message: 'x' }, 400),
    () => reply({ status: 'access_changed', access: { status: 'nobody' } }, 200),
    () => reply({ status: 'unknown' }, 200),
    () => new TypeError('Failed to fetch'),
    () => new DOMException('aborted', 'AbortError'),
  ];
  for (const respond of failures) {
    const { port } = client(respond);
    for (const result of [await port.read({ expectedUserId: A }), await port.mutate(command())]) {
      assert.equal(result.status, 'retryable');
      assert.equal(typeof result.message, 'string');
    }
  }
});

test('access failures become CartAccess errors, while a 200 error access passes through', async () => {
  for (const respond of [
    () => reply('<html></html>', 200, 'text/html'),
    () => reply({ status: 'guest' }, 503),
    () => reply({ status: 'member', userId: 'not-a-uuid' }, 200),
    () => reply({ status: 'restricted', reason: 'other' }, 200),
    () => new TypeError('Failed to fetch'),
  ]) {
    const { port } = client(respond);
    assert.equal((await port.resolveAccess()).status, 'error');
  }
  const passthrough = { status: 'error', message: '서버 확인 실패' };
  assert.deepEqual(await client(() => reply(passthrough)).port.resolveAccess(), passthrough);
  for (const access of [{ status: 'guest' }, { status: 'restricted' }]) {
    assert.deepEqual(await client(() => reply(access)).port.resolveAccess(), access);
  }
});

test('origin (403) and body-size (413) rejections are transport problems, not a server verdict', async () => {
  for (const status of [403, 413]) {
    const { port } = client(() => reply({ status: 'invalid', message: '전송 거부' }, status));
    assert.equal((await port.mutate(command())).status, 'retryable');
    assert.equal((await port.read({ expectedUserId: A })).status, 'retryable');
  }
});

test('a request with no answer is cut off after the timeout and handled as a lost reply', async () => {
  const { port } = client(hang, 20);
  assert.equal((await port.mutate(command())).status, 'retryable');
  assert.equal((await port.read({ expectedUserId: A })).status, 'retryable');
  assert.equal((await port.resolveAccess()).status, 'error');
});

test('a product load with no answer is cut off after the timeout', async t => {
  const previous = globalThis.fetch;
  t.after(() => { globalThis.fetch = previous; });
  globalThis.fetch = hang;
  const { loadCartProducts } = loadTs('src/features/cart/cart-product-client.ts');
  await assert.rejects(loadCartProducts([{ productId: 1, variantId: 2 }], 20));
});
