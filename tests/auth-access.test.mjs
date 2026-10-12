import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

const active = { id: 'member-1', status: 'active', deleted_at: null };
const verified = { id: 'member-1', email: 'visitor@example.com', email_confirmed_at: '2026-10-11' };

function service(user, member = active, authError = null, queryError = null) {
  const mod = loadTs('src/domains/auth/member-access.server.ts', {
    '@/shared/lib/supabase/auth-server': {},
  });
  return mod.createMemberAccessService(
    { auth: { getUser: async () => ({ data: { user }, error: authError }) } },
    { findById: async id => {
      assert.equal(id, 'member-1');
      if (queryError) throw queryError;
      return member;
    } },
  );
}

test('only a confirmed active member is allowed', async () => {
  assert.deepEqual(await service(verified).findCurrent(), { status: 'active', member: active });
});
test('unconfirmed session returns a validated email for recovery', async () => {
  assert.deepEqual(await service({ ...verified, email_confirmed_at: null }).findCurrent(), {
    status: 'unverified', email: 'visitor@example.com',
  });
});
test('missing persisted member does not become a new signup request', async () => {
  assert.deepEqual(await service(verified, null).findCurrent(), { status: 'missing' });
});
test('suspension and deletion both block access', async () => {
  for (const member of [
    { ...active, status: 'suspended' },
    { ...active, status: 'deleted' },
    { ...active, deleted_at: '2026-10-11' },
  ]) assert.equal((await service(verified, member).findCurrent()).status, 'unavailable');
});
test('member query failure stays retryable instead of looking like a missing member', async () => {
  assert.equal((await service(verified, null, null, new Error('offline')).findCurrent()).status, 'error');
});
test('missing session is unauthenticated while transient Auth failures are retryable', async () => {
  assert.equal((await service(null, null).findCurrent()).status, 'unauthenticated');
  assert.equal((await service(null, null, { name: 'AuthSessionMissingError' }).findCurrent()).status, 'unauthenticated');
  assert.equal((await service(null, null, { name: 'AuthRetryableFetchError', status: 503 }).findCurrent()).status, 'error');
});
test('request-bound client setup lets Next.js control-flow exceptions propagate', async () => {
  const bailout = new Error('Dynamic server usage: cookies');
  const { getCurrentMemberAccess } = loadTs('src/domains/auth/member-access.server.ts', {
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => { throw bailout; } },
  });
  await assert.rejects(getCurrentMemberAccess(), error => error === bailout);
});
test('guard redirects unverified accounts to recovery and never accepts a missing member', async () => {
  for (const [access, destination] of [
    [{ status: 'unauthenticated' }, '/login'],
    [{ status: 'unverified', email: 'visitor+demo@example.com' }, '/verify-email?email=visitor%2Bdemo%40example.com'],
    [{ status: 'missing' }, '/login'],
    [{ status: 'unavailable' }, '/login'],
  ]) {
    const { requireActiveMember } = loadTs('src/app/(auth)/require-active-member.ts', {
      '@/domains/auth/member-access.server': { getCurrentMemberAccess: async () => access },
      'next/navigation': { redirect: href => { throw new Error(`REDIRECT:${href}`); } },
    });
    await assert.rejects(requireActiveMember(), { message: `REDIRECT:${destination}` });
  }
});

test('protected mutation never invokes fixture operations when access is denied', async () => {
  const { createMypageAddressAction } = loadTs('src/app/(mypage)/mypage/address/actions.ts', {
    '@/app/(auth)/require-active-member': { requireActiveMember: async () => { throw new Error('DENIED'); } },
    '@/domains/member': {
      currentUserRepository: { findCurrent: async () => ({ id: 'fixture-user' }) },
      createUserAddress: () => { throw new Error('MUTATED_WITHOUT_ACCESS'); },
    },
  });
  await assert.rejects(createMypageAddressAction({}), { message: 'DENIED' });
});
test('protected mutation uses the server session ID rather than a fixture identity', async () => {
  let receivedId;
  const { createMypageAddressAction } = loadTs('src/app/(mypage)/mypage/address/actions.ts', {
    '@/app/(auth)/require-active-member': { requireActiveMember: async () => ({ id: 'real-member' }) },
    '@/domains/member': {
      currentUserRepository: { findCurrent: async () => ({ id: 'fixture-user' }) },
      createUserAddress: async id => { receivedId = id; return true; },
    },
  });
  assert.equal(await createMypageAddressAction({}), true);
  assert.equal(receivedId, 'real-member');
});
