import assert from 'node:assert/strict';
import { test } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { loadTs as baseLoadTs } from './helpers/load-ts.mjs';
const loadTs = (file, mocks = {}) => baseLoadTs(file, mocks);

process.env.AUTH_FEATURES_ENABLED = 'true';

test('restricted auth forms keep inputs available, show the restriction and disable request buttons', () => {
  const signupRestriction = { reason: 'feature_disabled', message: '데모 환경에서는 회원가입을 이용할 수 없습니다.' };
  const recoveryRestriction = { reason: 'feature_disabled', message: '데모 환경에서는 비밀번호를 재설정할 수 없습니다.' };
  const emailRestriction = { reason: 'feature_disabled', message: '데모 환경에서는 이메일 인증을 진행할 수 없습니다.' };
  const unexpected = async () => { throw new Error('UNEXPECTED_REQUEST'); };
  for (const [file, name, props, restriction] of [
    ['signup-form', 'SignupForm', { termsViewModel: [], onSuccess() {} }, signupRestriction],
    ['signup-otp-form', 'SignupOtpForm', { email: 'visitor@example.com', initialCodeRequested: true }, emailRestriction],
    ['find-password-form', 'FindPasswordForm', { requestAction: unexpected, onSent() {} }, recoveryRestriction],
    ['password-reset-otp-form', 'PasswordResetOtpForm', { email: 'visitor@example.com', otpExpiresAt: Date.now() + 300000, requestAction: unexpected, verifyAction: unexpected, onResult() {} }, recoveryRestriction],
    ['reset-password-form', 'ResetPasswordForm', { resetAction: unexpected, onResult() {} }, recoveryRestriction],
  ]) {
    const Component = loadTs(`src/features/auth/${file}.tsx`, {
      'next/navigation': { useRouter: () => ({ push() {}, replace() {}, refresh() {} }) },
      '@/shared/lib/supabase/server': { supabase: {} },
    })[name];
    const html = renderToStaticMarkup(createElement(Component, { ...props, restriction }));
    assert.ok(html.includes(restriction.message), `${name} must explain the restriction`);
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
    const requests = buttons.filter(button => /type="submit"/.test(button) || /인증번호 (?:받기|재전송)/.test(button));
    assert.ok(requests.length > 0, `${name} must retain its request controls`);
    for (const button of requests) assert.match(button, /disabled=""/, name);
    for (const input of html.match(/<input\b[^>]*>/g) ?? []) {
      assert.doesNotMatch(input, /disabled=""/, `${name} inputs must stay available`);
    }
  }
});

test('restricted auth pages forward feature-specific restrictions while keeping navigation', async () => {
  process.env.AUTH_FEATURES_ENABLED = 'false';
  try {
    const { toSignupTerms } = loadTs('src/domains/terms/mapper.ts');
    for (const [route, message, props] of [
      ['signup', '데모 환경에서는 회원가입을 이용할 수 없습니다.', {}],
      ['find-password', '데모 환경에서는 비밀번호를 재설정할 수 없습니다.', {}],
      ['verify-email', '데모 환경에서는 이메일 인증을 진행할 수 없습니다.', {
        searchParams: Promise.resolve({ email: 'visitor@example.com' }),
      }],
    ]) {
      const Page = loadTs(`src/app/(auth)/${route}/page.tsx`, {
        '@/domains/auth/member-access.server': { getCurrentMemberAccess: async () => ({ status: 'unauthenticated' }) },
        '@/domains/terms': { termRepository: { findEffective: async () => [] }, toSignupTerms },
        'next/navigation': { useRouter: () => ({ push() {}, replace() {}, refresh() {} }), redirect: href => { throw new Error(`REDIRECT:${href}`); } },
      }).default;
      const html = renderToStaticMarkup(await Page(props));
      assert.ok(html.includes(message), route);
      assert.match(html, /href="\/login"/, route);
      assert.match(html, /type="(?:submit|button)"[^>]*disabled=""/, route);
    }
  } finally {
    process.env.AUTH_FEATURES_ENABLED = 'true';
  }
});

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
test('one render shares one auth check across layouts, pages and the cart boundary', async () => {
  let clients = 0;
  const memo = fn => { let value; return () => (value ??= fn()); };
  const { getCurrentMemberAccess } = loadTs('src/domains/auth/member-access.server.ts', {
    react: { cache: memo },
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => { clients++; return { auth: { getUser: async () => ({ data: { user: null }, error: null }) } }; } },
    '@/domains/member/supabase-repository.server': { createMemberAccessRepository: () => ({ findById: async () => null }) },
  });
  await getCurrentMemberAccess();
  await getCurrentMemberAccess();
  assert.equal(clients, 1);
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

function loadAddressActions(requireActiveMember, created = []) {
  let clients = 0;
  const actions = loadTs('src/app/(mypage)/mypage/address/actions.ts', {
    '@/app/(auth)/require-active-member': { requireActiveMember },
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => { clients++; return {}; } },
    '@/domains/member/supabase-repository.server': {
      createUserAddressRepository: () => ({ create: async (userId, address) => { created.push({ userId, address }); } }),
    },
    'next/cache': { revalidatePath: () => {} },
  });
  return { actions, clients: () => clients };
}
const validAddress = {
  label: '', recipientName: '수령인', phoneNumber: '010-1234-5678', postalCode: '06134',
  addressLine1: '서울특별시 강남구 테헤란로 123', addressLine2: '101동 1203호', deliveryNote: '', isDefault: false,
};
test('protected mutation never opens a DB client when access is denied', async () => {
  const { actions, clients } = loadAddressActions(async () => { throw new Error('DENIED'); });
  await assert.rejects(actions.createMypageAddressAction(validAddress), { message: 'DENIED' });
  assert.equal(clients(), 0);
});
test('protected mutation uses the server session ID rather than a fixture identity', async () => {
  const created = [];
  const { actions } = loadAddressActions(async () => ({ id: 'real-member' }), created);
  assert.equal(await actions.createMypageAddressAction(validAddress), true);
  assert.equal(created.length, 1);
  assert.equal(created[0].userId, 'real-member');
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
      useRouter: () => ({ push() {}, replace() {}, refresh() {} }),
    },
  }).default;
}

test('demo login defaults are real editable values and leave login enabled', () => {
  const { LoginForm } = loadTs('src/features/auth/login-form.tsx', {
    '@/app/(auth)/actions': { loginAction: async () => { throw new Error('Unexpected login during render'); } },
    'next/navigation': { useRouter: () => ({ push() {}, replace() {}, refresh() {} }) },
  });
  const html = renderToStaticMarkup(createElement(LoginForm, {
    demoAccount: { email: 'demo@example.com', password: 'PublicDemo!234' },
  }));
  assert.match(html, /데모 계정으로 로그인하고 쇼핑몰을 둘러보세요/);
  assert.match(html, /name="email"[^>]*value="demo@example.com"/);
  assert.match(html, /name="password"[^>]*value="PublicDemo!234"/);
  assert.doesNotMatch(html, /disabled=""|readOnly=""/);
  assert.match(html, /type="submit"/);
});

test('ordinary login starts with blank credentials and no demo notice', () => {
  const { LoginForm } = loadTs('src/features/auth/login-form.tsx', {
    '@/app/(auth)/actions': { loginAction: async () => { throw new Error('Unexpected login during render'); } },
    'next/navigation': { useRouter: () => ({ push() {}, replace() {}, refresh() {} }) },
  });
  const html = renderToStaticMarkup(createElement(LoginForm));
  assert.match(html, /name="email"[^>]*value=""/);
  assert.match(html, /name="password"[^>]*value=""/);
  assert.doesNotMatch(html, /데모 계정으로 로그인하고 쇼핑몰을 둘러보세요/);
});

test('the login page supplies demo defaults only when auth features are restricted', async () => {
  try {
    for (const value of ['true', 'false', undefined]) {
      if (value === undefined) delete process.env.AUTH_FEATURES_ENABLED;
      else process.env.AUTH_FEATURES_ENABLED = value;
      const LoginPage = loadLoginPage({ status: 'unauthenticated' });
      const html = renderToStaticMarkup(await LoginPage());
      if (value === 'true') {
        assert.match(html, /name="email"[^>]*value=""/);
        assert.match(html, /name="password"[^>]*value=""/);
        assert.doesNotMatch(html, /데모 계정으로 로그인하고 쇼핑몰을 둘러보세요/);
      } else {
        assert.match(html, /name="email"[^>]*value="demo@example.com"/);
        assert.match(html, /name="password"[^>]*value="[^"]+"/);
        assert.match(html, /데모 계정으로 로그인하고 쇼핑몰을 둘러보세요/);
      }
    }
  } finally {
    process.env.AUTH_FEATURES_ENABLED = 'true';
  }
});

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
