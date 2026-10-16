import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

test('successful logout expires the SSR session cookie before navigating home', async t => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://logout-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-public-key';
  t.after(() => {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousKey;
  });

  const cookieName = 'sb-logout-test-auth-token';
  const session = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: { id: '11111111-1111-4111-8111-111111111111', email: 'visitor@example.com' },
  };
  const cookieValue = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
  const cookies = new Map([[cookieName, cookieValue]]);
  const writes = [];
  const requests = [];

  t.mock.method(globalThis, 'fetch', async (url, options) => {
    requests.push({ url: String(url), method: options.method });
    assert.equal(String(url), 'https://logout-test.supabase.co/auth/v1/logout?scope=local');
    assert.equal(options.method, 'POST');
    return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
  });

  const { logoutAction } = loadTs('src/app/(auth)/actions.ts', {
    '@/domains/terms': {},
    '@/domains/auth/member-access.server': {},
    'next/headers': { cookies: async () => ({
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      set: (name, value, options) => {
        writes.push({ name, value, options });
        if (options.maxAge === 0) cookies.delete(name);
        else cookies.set(name, value);
      },
    }) },
    'next/navigation': {
      RedirectType: { replace: 'replace' },
      redirect: (href, type) => {
        assert.equal(cookies.has(cookieName), false);
        assert.equal(type, 'replace');
        throw new Error(`REDIRECT:${href}`);
      },
    },
  });

  await assert.rejects(logoutAction(null), { message: 'REDIRECT:/' });
  assert.equal(requests.length, 1);
  assert.ok(writes.some(cookie =>
    cookie.name === cookieName && cookie.value === '' && cookie.options.maxAge === 0,
  ));
});
