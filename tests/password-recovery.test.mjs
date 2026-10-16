import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { loadTs } from './helpers/load-ts.mjs';

const path = 'src/domains/auth/password-recovery.server.ts';
const id = '11111111-1111-4111-8111-111111111111';
const user = { id, email: 'visitor@example.com', email_confirmed_at: '2026-10-14' };
const grant = () => ({ purpose: 'password-recovery', userId: id, email: user.email, refreshToken: 'old-refresh', expiresAt: Date.now() + 300000 });
function setup({ authUser = user, member = { id, status: 'active', deleted_at: null }, updateError, updateThrows, logoutError, logoutThrows, readThrows, afterRead, refreshError } = {}) {
  assert.ok(fs.existsSync(path), 'recovery service must exist');
  const calls = { request: [], otp: [], refresh: [], update: [], logout: [], members: [] };
  const client = { auth: {
    resetPasswordForEmail: async email => { calls.request.push(email); return { error: null }; },
    verifyOtp: async input => { calls.otp.push(input); return { data: { user: authUser, session: { refresh_token: 'verified-refresh' } }, error: null }; },
    refreshSession: async input => { calls.refresh.push(input); return { data: { user: authUser, session: { refresh_token: 'rotated-refresh' } }, error: refreshError }; },
    getUser: async () => ({ data: { user: authUser }, error: null }),
    updateUser: async input => { calls.update.push(input); if (updateThrows) throw updateThrows; return { error: updateError }; },
    getSession: async () => ({ data: { session: { access_token: 'verified-access-token' } }, error: null }),
    admin: { signOut: async (token, scope) => {
      assert.equal(token, 'verified-access-token');
      calls.logout.push({ scope });
      if (logoutThrows) throw logoutThrows;
      return { error: logoutError };
    } },
  } };
  const mod = loadTs(path, {
    '@/shared/lib/supabase/ephemeral-server': { createEphemeralServerClient: () => client },
    '@/shared/lib/supabase/auth-server': {},
    '@/domains/member/supabase-repository.server': { createMemberAccessRepository: () => ({ findById: async received => {
      calls.members.push(received); if (readThrows) throw readThrows; afterRead?.(); return member;
    } }) },
  });
  return { ...mod, calls, client, context: { client, grant: grant() } };
}
test('request and recovery verification use recovery APIs and a five minute grant', async t => {
  t.mock.method(Date, 'now', () => 1000000);
  const s = setup({ authUser: { ...user, email_confirmed_at: null } });
  assert.deepEqual(await s.requestPasswordRecovery(user.email), { status: 'sent', otpExpiresAt: 1300000 });
  const result = await s.verifyPasswordRecoveryOtp(user.email, '123456');
  assert.equal(result.status, 'verified');
  assert.equal(result.grant.expiresAt, 1300000);
  assert.equal(result.grant.userId, id);
  assert.deepEqual(s.calls.otp, [{ email: user.email, token: '123456', type: 'recovery' }]);
});
test('restoration rotates tokens while preserving the first expiry and checks identity', async () => {
  const s = setup();
  const original = grant();
  const result = await s.restorePasswordRecovery(original);
  assert.equal(result.status, 'ready');
  assert.equal(result.context.grant.expiresAt, original.expiresAt);
  assert.equal(result.context.grant.refreshToken, 'rotated-refresh');
  assert.deepEqual(s.calls.refresh, [{ refresh_token: 'old-refresh' }]);
  const wrong = setup({ authUser: { ...user, id: 'other-user' } });
  assert.equal((await wrong.restorePasswordRecovery(original)).status, 'restart');
});
test('expired authority never refreshes or changes a password', async () => {
  const s = setup();
  const expired = { ...grant(), expiresAt: Date.now() - 1 };
  assert.equal((await s.restorePasswordRecovery(expired)).status, 'restart');
  assert.equal((await s.resetRecoveredPassword({ client: s.client, grant: expired }, 'Password!1')).status, 'restart');
  assert.equal(s.calls.refresh.length, 0);
  assert.equal(s.calls.update.length, 0);
});
test('active member changes only their own password and requests global logout', async () => {
  const s = setup();
  assert.deepEqual(await s.resetRecoveredPassword(s.context, 'Password!1'), { status: 'success' });
  assert.deepEqual(s.calls.members, [id]);
  assert.deepEqual(s.calls.update, [{ password: 'Password!1' }]);
  assert.deepEqual(s.calls.logout, [{ scope: 'global' }]);
});
test('missing, suspended and deleted members cannot mutate auth', async () => {
  for (const member of [null, { id, status: 'suspended' }, { id, status: 'active', deleted_at: '2026-10-14' }]) {
    const s = setup({ member });
    assert.equal((await s.resetRecoveredPassword(s.context, 'Password!1')).status, 'restart');
    assert.equal(s.calls.update.length, 0);
  }
});
test('transient reads remain retryable and expiry is checked again after member lookup', async t => {
  const offline = setup({ readThrows: new Error('private DB error') });
  assert.equal((await offline.resetRecoveredPassword(offline.context, 'Password!1')).status, 'error');
  assert.equal(offline.calls.update.length, 0);
  let now = 1000000;
  t.mock.method(Date, 'now', () => now);
  const delayed = setup({ afterRead: () => { now = 1300000; } });
  assert.equal((await delayed.resetRecoveredPassword(delayed.context, 'Password!1')).status, 'restart');
  assert.equal(delayed.calls.update.length, 0);
});
test('password rejection, uncertain update and post-update logout failure stay distinct', async () => {
  const rejected = setup({ updateError: { code: 'same_password', status: 422, message: 'PRIVATE' } });
  assert.equal((await rejected.resetRecoveredPassword(rejected.context, 'Password!1')).status, 'error');
  const lost = setup({ updateThrows: new Error('PRIVATE NETWORK') });
  const unknown = await lost.resetRecoveredPassword(lost.context, 'Password!1');
  assert.equal(unknown.status, 'unknown');
  assert.equal(lost.calls.logout.length, 0);
  for (const options of [{ logoutError: { message: 'PRIVATE' } }, { logoutThrows: new Error('PRIVATE') }]) {
    const s = setup(options);
    const result = await s.resetRecoveredPassword(s.context, 'Password!1');
    assert.equal(result.status, 'partial_success');
    assert.equal(s.calls.update.length, 1);
    assert.equal(JSON.stringify(result).includes('PRIVATE'), false);
  }
});
