import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
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

function loadLoginPage(access) {
  return loadTs('src/app/(auth)/login/page.tsx', {
    '@/domains/auth/member-access.server': {
      getCurrentMemberAccess: async () => access,
    },
    '@/app/(auth)/actions': {
      loginAction: async () => { throw new Error('Unexpected login during render'); },
      logoutAction: async () => { throw new Error('Unexpected logout during render'); },
    },
    'next/navigation': {
      redirect: href => { throw new Error(`REDIRECT:${href}`); },
      useRouter: () => ({ push() {}, replace() {} }),
    },
  }).default;
}

for (const status of ['missing', 'unavailable']) {
  test(`${status} member gets a logout form instead of login and recovery controls`, async () => {
    const LoginPage = loadLoginPage({ status });
    const html = renderToStaticMarkup(await LoginPage());
    assert.match(html, /role="alert"/);
    assert.match(html, /<button\b[^>]*type="submit"[^>]*>로그아웃<\/button>/);
    assert.equal((html.match(/<form\b/g) || []).length, 1);
    assert.doesNotMatch(html, /type="(?:email|password)"/);
    assert.doesNotMatch(html, /href="\/(?:signup|find-password)"/);
  });
}

for (const access of [
  { status: 'unauthenticated' },
  { status: 'unverified', email: 'visitor@example.com' },
  { status: 'error' },
]) {
  test(`${access.status} keeps the normal login form without a blocked-account notice`, async () => {
    const LoginPage = loadLoginPage(access);
    const html = renderToStaticMarkup(await LoginPage());
    assert.match(html, /type="email"/);
    assert.match(html, /type="password"/);
    assert.match(html, /href="\/find-password"/);
    assert.match(html, /href="\/signup"/);
    assert.doesNotMatch(html, />로그아웃<\/button>/);
  });
}

test('an active member is redirected away from login', async () => {
  const LoginPage = loadLoginPage({ status: 'active', member: active });
  await assert.rejects(LoginPage(), { message: 'REDIRECT:/' });
});

test('an active member cannot render the password recovery page', async () => {
  const { default: FindPasswordPage } = loadTs('src/app/(auth)/find-password/page.tsx', {
    '@/domains/auth/member-access.server': {
      getCurrentMemberAccess: async () => ({ status: 'active', member: active }),
    },
    'next/navigation': { redirect: href => { throw new Error(`REDIRECT:${href}`); } },
  });
  await assert.rejects(async () => FindPasswordPage(), { message: 'REDIRECT:/' });
});

test('a guest can see an enabled recovery form and account navigation', async () => {
  const { default: FindPasswordPage } = loadTs('src/app/(auth)/find-password/page.tsx', {
    '@/domains/auth/member-access.server': {
      getCurrentMemberAccess: async () => ({ status: 'unauthenticated' }),
    },
  });
  const html = renderToStaticMarkup(await FindPasswordPage());
  assert.match(html, /type="email"/);
  assert.doesNotMatch(html, /type="submit"[^>]*disabled=""/);
  assert.match(html, /href="\/login"/);
  assert.match(html, /href="\/signup"/);
});

test('recovery OTP has six slots and blocks expired verification while allowing resend', () => {
  const { PasswordResetOtpForm } = loadTs('src/features/auth/password-reset-otp-form.tsx');
  const html = renderToStaticMarkup(createElement(PasswordResetOtpForm, {
    email: 'visitor@example.com', otpExpiresAt: Date.now() - 1000,
    requestAction: async () => {}, verifyAction: async () => {}, onResult: () => {},
  }));
  assert.match(html, /maxlength="6"/i);
  assert.equal((html.match(/data-slot="input-otp-slot"/g) || []).length, 6);
  const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g);
  assert.match(buttons.find(button => button.includes('인증 확인')), /disabled=""/);
  assert.doesNotMatch(buttons.find(button => button.includes('인증번호 재전송')), /disabled=""/);
  assert.match(html, /00:00/);
});
test('reset form provides two new-password inputs and no identity input', () => {
  const { ResetPasswordForm } = loadTs('src/features/auth/reset-password-form.tsx');
  const html = renderToStaticMarkup(createElement(ResetPasswordForm, { resetAction: async () => {}, onResult: () => {} }));
  assert.equal((html.match(/type="password"/g) || []).length, 2);
  assert.equal((html.match(/autoComplete="new-password"/gi) || []).length, 2);
  assert.doesNotMatch(html, /name="(?:email|userId)"/);
});
