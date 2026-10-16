import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { loadTs } from './helpers/load-ts.mjs';

process.env.AUTH_FEATURES_ENABLED = 'true';

const path = 'src/app/(auth)/find-password/actions.ts';
const grant = () => ({ purpose: 'password-recovery', userId: '11111111-1111-4111-8111-111111111111', email: 'visitor@example.com', refreshToken: 'PRIVATE_REFRESH', expiresAt: Date.now() + 300000 });
function setup({ ordinaryUser = null, ordinaryError = null, cookie = { status: 'missing' }, writeThrows, clearThrows, resetResult = { status: 'success' }, restoreResult, contextThrows } = {}) {
  assert.ok(fs.existsSync(path), 'recovery actions must exist');
  const calls = { request: 0, otp: 0, restore: 0, reset: 0, write: [], clear: 0, order: [] };
  const refreshed = { ...grant(), refreshToken: 'ROTATED_PRIVATE' };
  const context = { client: {}, grant: refreshed };
  const actions = loadTs(path, {
    'next/headers': { cookies: async () => { if (contextThrows) throw contextThrows; return {}; } },
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => ({ auth: { getUser: async () => ({ data: { user: ordinaryUser }, error: ordinaryError }) } }) },
    './recovery-session.server': {
      assertRecoveryConfiguration: () => {},
      readRecoveryGrant: async () => cookie,
      writeRecoveryGrant: async value => { calls.order.push('write'); if (writeThrows) throw writeThrows; calls.write.push(value); },
      clearRecoveryGrant: async () => { calls.clear++; if (clearThrows) throw clearThrows; },
    },
    '@/domains/auth/password-recovery.server': {
      requestPasswordRecovery: async () => { calls.request++; return { status: 'sent', otpExpiresAt: 123 }; },
      verifyPasswordRecoveryOtp: async () => { calls.otp++; return { status: 'verified', grant: grant() }; },
      restorePasswordRecovery: async () => { calls.restore++; return restoreResult ?? { status: 'ready', context }; },
      resetRecoveredPassword: async () => { calls.order.push('reset'); calls.reset++; return resetResult; },
    },
  });
  return { ...actions, calls };
}
const otp = { email: 'visitor@example.com', token: '123456' };
const password = { password: 'Password!1', confirmPassword: 'Password!1' };

test('disabled recovery blocks every action before Auth, cookies, restoration or password changes', async () => {
  process.env.AUTH_FEATURES_ENABLED = 'false';
  try {
    const actions = loadTs(path, {
      'next/headers': { cookies: async () => { throw new Error('UNEXPECTED_COOKIES'); } },
      '@/shared/lib/supabase/auth-server': {
        createAuthClient: async () => { throw new Error('UNEXPECTED_AUTH'); },
      },
      './recovery-session.server': {
        assertRecoveryConfiguration: () => { throw new Error('UNEXPECTED_CONFIG'); },
      },
    });
    for (const [name, input] of [
      ['requestPasswordRecoveryAction', { email: otp.email }],
      ['verifyPasswordRecoveryOtpAction', otp],
      ['resetPasswordAction', password],
    ]) {
      assert.deepEqual(await actions[name](input), {
        status: 'error', reason: 'feature_disabled',
        message: '데모 환경에서는 비밀번호를 재설정할 수 없습니다.',
      });
    }
  } finally {
    process.env.AUTH_FEATURES_ENABLED = 'true';
  }
});

test('invalid input, ordinary confirmed sessions and transient auth reads cannot request recovery', async () => {
  const invalid = setup();
  assert.equal((await invalid.requestPasswordRecoveryAction({ email: 'bad' })).status, 'error');
  assert.equal(invalid.calls.request, 0);
  for (const options of [{ ordinaryUser: { email_confirmed_at: '2026-10-14' } }, { ordinaryError: { status: 503 } }]) {
    const s = setup(options);
    assert.equal((await s.requestPasswordRecoveryAction({ email: otp.email })).status, 'error');
    assert.equal(s.calls.request, 0);
  }
  const unconfirmed = setup({ ordinaryUser: { email_confirmed_at: null } });
  assert.equal((await unconfirmed.requestPasswordRecoveryAction({ email: otp.email })).status, 'sent');
});
test('verification returns no token and cannot succeed before cookie persistence', async () => {
  const s = setup();
  const result = await s.verifyPasswordRecoveryOtpAction(otp);
  assert.equal(result.status, 'verified');
  assert.equal(JSON.stringify(result).includes('PRIVATE'), false);
  assert.equal(s.calls.write.length, 1);
  const denied = setup({ writeThrows: new Error('PRIVATE_COOKIE') });
  assert.equal((await denied.verifyPasswordRecoveryOtpAction(otp)).status, 'restart');
});
test('lost verification response resumes the same target without consuming OTP again', async () => {
  const s = setup({ cookie: { status: 'valid', grant: grant() } });
  assert.equal((await s.verifyPasswordRecoveryOtpAction(otp)).status, 'verified');
  assert.equal(s.calls.otp, 0);
  assert.equal(s.calls.restore, 1);
  const other = setup({ cookie: { status: 'valid', grant: { ...grant(), email: 'other@example.com' } } });
  assert.equal((await other.verifyPasswordRecoveryOtpAction(otp)).status, 'restart');
  assert.equal(other.calls.restore, 0);
});
test('missing, invalid, expired restoration or failed rotation write cannot change password', async () => {
  for (const options of [
    {}, { cookie: { status: 'invalid' } },
    { cookie: { status: 'valid', grant: grant() }, restoreResult: { status: 'restart', message: 'expired' } },
    { cookie: { status: 'valid', grant: grant() }, writeThrows: new Error('write denied') },
  ]) {
    const s = setup(options);
    assert.equal((await s.resetPasswordAction(password)).status, 'restart');
    assert.equal(s.calls.reset, 0);
  }
});
test('rotation is saved before mutation and terminal results clear authority', async () => {
  for (const status of ['success', 'partial_success', 'unknown', 'restart']) {
    const s = setup({ cookie: { status: 'valid', grant: grant() }, resetResult: { status, message: status } });
    const result = await s.resetPasswordAction(password);
    assert.equal(result.status, status);
    assert.deepEqual(s.calls.order, ['write', 'reset']);
    assert.equal(s.calls.clear, 1);
    assert.equal(JSON.stringify(result).includes('PRIVATE'), false);
  }
  const retry = setup({ cookie: { status: 'valid', grant: grant() }, resetResult: { status: 'error', message: 'retry' } });
  assert.equal((await retry.resetPasswordAction(password)).status, 'error');
  assert.equal(retry.calls.clear, 0);
});
test('cleanup failure cannot turn changed or uncertain passwords into retryable failure', async () => {
  for (const status of ['success', 'partial_success', 'unknown']) {
    const s = setup({ cookie: { status: 'valid', grant: grant() }, resetResult: { status, message: 'safe' }, clearThrows: new Error('PRIVATE_CLEAR') });
    const result = await s.resetPasswordAction(password);
    assert.equal(result.status, status === 'unknown' ? 'unknown' : 'partial_success');
    assert.equal(s.calls.reset, 1);
    assert.equal(JSON.stringify(result).includes('PRIVATE'), false);
  }
});
test('Next cookie context control flow propagates instead of becoming an auth error', async () => {
  const bailout = new Error('Next rendering control flow');
  const s = setup({ contextThrows: bailout });
  await assert.rejects(s.requestPasswordRecoveryAction({ email: otp.email }), e => e === bailout);
});

async function realSdkFlow(t, logoutStatus = 200) {
  const keys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PASSWORD_RECOVERY_SECRET'];
  const previous = keys.map(key => [key, process.env[key]]);
  process.env.SUPABASE_URL = 'https://recovery-test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-public-key';
  process.env.PASSWORD_RECOVERY_SECRET = Buffer.alloc(32, 7).toString('base64');
  t.after(() => { for (const [key,value] of previous) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } });
  const user = { id: grant().userId, email: otp.email, email_confirmed_at: '2026-10-14' };
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const accessToken = encode({ alg: 'HS256', typ: 'JWT' }) + '.' + encode({ sub: user.id, aud: 'authenticated', exp: Math.floor(Date.now()/1000)+3600 }) + '.c2ln';
  const jar = new Map();
  const writes = [];
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const parsed = new URL(url);
    requests.push({ path: parsed.pathname, search: parsed.search, method: options.method, body: options.body ? JSON.parse(options.body) : null });
    let data;
    if (parsed.pathname.endsWith('/verify') || parsed.pathname.endsWith('/token')) {
      data = { access_token: accessToken, refresh_token: parsed.pathname.endsWith('/verify') ? 'verified-refresh' : 'rotated-refresh', expires_in: 3600, token_type: 'bearer', user };
    } else if (parsed.pathname === '/auth/v1/user') data = user;
    else if (parsed.pathname === '/rest/v1/users') data = { id: user.id, status: 'active', deleted_at: null };
    else if (parsed.pathname === '/auth/v1/logout') return new Response(JSON.stringify(logoutStatus === 200 ? {} : { code: 'bad_jwt', msg: 'PRIVATE_REJECTED' }), { status: logoutStatus, headers: { 'Content-Type': 'application/json' } });
    else throw new Error('Unexpected test request: ' + parsed.pathname);
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  const actions = loadTs(path, {
    'next/headers': { cookies: async () => ({
      get: key => jar.has(key) ? { value: jar.get(key) } : undefined,
      getAll: () => [...jar].map(([name,value]) => ({ name,value })),
      set: (name,value,options) => { writes.push(name); if (options.maxAge === 0) jar.delete(name); else jar.set(name,value); },
    }) },
  });
  assert.equal((await actions.verifyPasswordRecoveryOtpAction(otp)).status, 'verified');
  assert.equal(jar.has('bang-password-recovery'), true);
  const result = await actions.resetPasswordAction(password);
  assert.equal(result.status, logoutStatus === 200 ? 'success' : 'partial_success');
  assert.equal(JSON.stringify(result).includes('PRIVATE_REJECTED'), false);
  assert.equal(jar.has('bang-password-recovery'), false);
  assert.equal(writes.some(name => name.startsWith('sb-')), false);
  assert.equal(requests.filter(r => r.method === 'PUT' && r.path === '/auth/v1/user').length, 1);
  assert.equal(requests.filter(r => r.path === '/rest/v1/users').length, 1);
  assert.ok(requests.some(r => r.path === '/auth/v1/logout' && r.search === '?scope=global'));
  assert.equal(requests.find(r => r.path === '/auth/v1/verify').body.type, 'recovery');
}


test('real SDK and encrypted cookies verify, restore, mutate and clear without ordinary login cookies', async t => { await realSdkFlow(t); });
test('real SDK logout HTTP refusal stays partial success rather than being masked', async t => {
  for (const status of [401,403,404]) await t.test('logout HTTP ' + status, async child => { await realSdkFlow(child, status); });
});
