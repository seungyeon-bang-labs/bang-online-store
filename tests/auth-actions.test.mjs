import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTs } from './helpers/load-ts.mjs';

process.env.AUTH_FEATURES_ENABLED = 'true';

const requiredId = '11111111-1111-4111-8111-111111111111';
const optionalId = '22222222-2222-4222-8222-222222222222';
const terms = [
  { id: requiredId, title: '이용약관', is_required: true, term_codes: { code: 'service', kind: 'document' } },
  { id: optionalId, title: '광고 동의', is_required: false, term_codes: { code: 'marketing', kind: 'document' } },
];
const input = {
  name: '방 회원', phone_number: '010-1234-5678', email: ' visitor@example.com ',
  password: 'Password!1', confirmPassword: 'Password!1',
  agreements: { service: true, marketing: false }, displayed_term_ids: [requiredId, optionalId],
};

function setup({ signInError = null, signInThrows = null, otpError = null, access = { status: 'active', member: { id: 'server-user' } }, signupError = null, signupThrows = null, signOutError = null, signOutThrows = null } = {}) {
  const calls = { signup: [], otp: [], resend: [], signOut: [], access: 0 };
  const client = { auth: {
    signOut: async options => {
      calls.signOut.push(options);
      if (signOutThrows) throw signOutThrows;
      return { error: signOutError };
    },
    signInWithPassword: async () => {
      if (signInThrows) throw signInThrows;
      return { error: signInError };
    },
    signUp: async payload => {
      calls.signup.push(payload);
      if (signupThrows) throw signupThrows;
      return { error: signupError };
    },
    verifyOtp: async payload => { calls.otp.push(payload); return { error: otpError }; },
    resend: async payload => { calls.resend.push(payload); return { error: null }; },
  } };
  const { toSignupTerms } = loadTs('src/domains/terms/mapper.ts');
  const actions = loadTs('src/app/(auth)/actions.ts', {
    'next/navigation': {
      RedirectType: { replace: 'replace' },
      redirect: (href, type) => { throw new Error(`REDIRECT:${href}:${type}`); },
    },
    '@/shared/lib/supabase/auth-server': { createAuthClient: async () => client },
    '@/domains/terms': { termRepository: { findEffective: async () => terms }, toSignupTerms },
    '@/domains/auth/member-access.server': { getCurrentMemberAccess: async () => { calls.access++; return access; } },
  });
  return { actions, calls };
}

test('logout ends only the current session and replaces the page with home', async () => {
  const { actions, calls } = setup();
  assert.equal(typeof actions.logoutAction, 'function');
  await assert.rejects(actions.logoutAction(null), { message: 'REDIRECT:/:replace' });
  assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
  assert.equal(calls.access, 0);
});

test('disabled signup and email verification reject before client setup, terms reads or member checks', async () => {
  process.env.AUTH_FEATURES_ENABLED = 'false';
  try {
    const actions = loadTs('src/app/(auth)/actions.ts', {
      '@/shared/lib/supabase/auth-server': {
        createAuthClient: async () => { throw new Error('UNEXPECTED_AUTH'); },
      },
      '@/domains/terms': {
        termRepository: { findEffective: async () => { throw new Error('UNEXPECTED_TERMS'); } },
      },
      '@/domains/auth/member-access.server': {
        getCurrentMemberAccess: async () => { throw new Error('UNEXPECTED_ACCESS'); },
      },
    });
    for (const action of [actions.signupAction, actions.resendSignupOtpAction, actions.verifySignupOtpAction]) {
      const result = await action({ email: 'visitor@example.com', token: '123456' });
      assert.equal(result.ok, false);
      assert.equal(result.reason, 'feature_disabled');
      assert.match(result.message, /데모 환경/);
    }
    const { actions: ordinary, calls } = setup();
    assert.equal((await ordinary.loginAction({ email: 'visitor@example.com', password: 'Password!1' })).status, 'success');
    assert.deepEqual(await ordinary.retrySignupMemberAction(), { ok: true });
    await assert.rejects(ordinary.logoutAction(), /REDIRECT:\/:replace/);
    assert.equal(calls.signOut.length, 1);
  } finally {
    process.env.AUTH_FEATURES_ENABLED = 'true';
  }
});
test('a rejected logout returns a safe retry message instead of navigating', async () => {
  const { actions } = setup({ signOutError: { message: 'PRIVATE_AUTH_FAILURE' } });
  assert.equal(typeof actions.logoutAction, 'function');
  const result = await actions.logoutAction(null);
  assert.match(result.message, /다시 시도/);
  assert.doesNotMatch(result.message, /PRIVATE_AUTH_FAILURE/);
});
test('a logout transport failure returns a retry message', async () => {
  const { actions } = setup({ signOutThrows: new Error('PRIVATE_NETWORK_FAILURE') });
  assert.equal(typeof actions.logoutAction, 'function');
  const result = await actions.logoutAction(null);
  assert.match(result.message, /다시 시도/);
  assert.doesNotMatch(result.message, /PRIVATE_NETWORK_FAILURE/);
});
test('unavailable and missing members can sign out without a member access lookup', async () => {
  for (const status of ['unavailable', 'missing']) {
    const { actions, calls } = setup({ access: { status } });
    await assert.rejects(actions.logoutAction(null), { message: 'REDIRECT:/:replace' });
    assert.deepEqual(calls.signOut, [{ scope: 'local' }]);
    assert.equal(calls.access, 0);
  }
});

test('confirmed login with an active store member returns success without throwing a redirect', async () => {
  const { actions, calls } = setup();
  assert.deepEqual(await actions.loginAction({
    email: 'visitor@example.com', password: 'Password!1',
  }), { status: 'success' });
  assert.equal(calls.access, 1);
});
test('unexpected login exceptions propagate to the caller before a member lookup', async () => {
  const failure = new Error('AUTH_REQUEST_FAILED');
  const { actions, calls } = setup({ signInThrows: failure });
  await assert.rejects(actions.loginAction({
    email: 'visitor@example.com', password: 'Password!1',
  }), error => error === failure);
  assert.equal(calls.access, 0);
});
test('unconfirmed login returns an email recovery result, not a password error', async () => {
  const { actions } = setup({ signInError: { code: 'email_not_confirmed' } });
  const result = await actions.loginAction({ email: 'visitor@example.com', password: 'Password!1' });
  assert.deepEqual(result, { status: 'verification_required', email: 'visitor@example.com' });
});
test('wrong credentials stay on login and never route into OTP', async () => {
  const { actions } = setup({ signInError: { code: 'invalid_credentials' } });
  assert.equal((await actions.loginAction({ email: 'visitor@example.com', password: 'wrong' })).status, 'error');
});
test('successful Auth login still rejects suspended or missing store members', async () => {
  for (const status of ['unavailable', 'missing']) {
    const { actions } = setup({ access: { status } });
    assert.equal((await actions.loginAction({ email: 'visitor@example.com', password: 'Password!1' })).status, 'error');
  }
});
test('stale or duplicated displayed terms never create an Auth account', async () => {
  for (const displayed_term_ids of [[requiredId], [requiredId, requiredId, optionalId]]) {
    const { actions, calls } = setup();
    assert.equal((await actions.signupAction({ ...input, displayed_term_ids })).ok, false);
    assert.equal(calls.signup.length, 0);
  }
});
test('signup transmits canonical metadata and only the checked term IDs', async () => {
  const { actions, calls } = setup();
  assert.equal((await actions.signupAction(input)).ok, true);
  assert.deepEqual(calls.signup[0], {
    email: 'visitor@example.com', password: 'Password!1',
    options: { data: {
      name: '방 회원', phone_number: '01012345678',
      agreed_term_ids: [requiredId], displayed_term_ids: [requiredId, optionalId],
    } },
  });
});
test('a storage rejection does not advance the signup form to OTP', async () => {
  const { actions } = setup({ signupError: { code: 'unexpected_failure' } });
  assert.equal((await actions.signupAction(input)).ok, false);
});
test('ambiguous signup outcomes explain email/login recovery instead of blindly repeating signup', async () => {
  for (const options of [
    { signupError: { name: 'AuthRetryableFetchError', status: 0 } },
    { signupError: { status: 503 } },
  ]) {
    const { actions } = setup(options);
    const result = await actions.signupAction(input);
    assert.equal(result.ok, false);
    assert.match(result.message, /이메일을 확인.*로그인/);
  }
});
test('unexpected signup exceptions propagate to the caller for recovery', async () => {
  const failure = new Error('RESPONSE_LOST');
  const { actions } = setup({ signupThrows: failure });
  await assert.rejects(actions.signupAction(input), error => error === failure);
});
test('OTP accepts six digits and rejects other lengths before requesting Supabase', async () => {
  for (const token of ['12345', '1234567', 'abcdef']) {
    const { actions, calls } = setup();
    assert.equal((await actions.verifySignupOtpAction({ email: 'visitor@example.com', token })).stage, 'otp');
    assert.equal(calls.otp.length, 0);
  }
});
test('verified OTP with a read failure enters member retry without repeating OTP', async () => {
  const { actions, calls } = setup({ access: { status: 'error' } });
  const result = await actions.verifySignupOtpAction({ email: 'visitor@example.com', token: '123456' });
  assert.equal(result.stage, 'member');
  assert.equal(result.retryable, true);
  assert.deepEqual(calls.otp, [{ type: 'email', email: 'visitor@example.com', token: '123456' }]);
  await actions.retrySignupMemberAction();
  assert.equal(calls.otp.length, 1);
  assert.equal(calls.access, 2);
});
test('an ambiguous OTP network or server failure offers a session check rather than another OTP attempt', async () => {
  for (const otpError of [{ name: 'AuthRetryableFetchError', status: 0 }, { status: 503 }]) {
    const { actions, calls } = setup({ otpError });
    const result = await actions.verifySignupOtpAction({ email: 'visitor@example.com', token: '123456' });
    assert.equal(result.stage, 'member');
    assert.equal(result.retryable, true);
    assert.equal(calls.otp.length, 1);
  }
});
test('a rejected or expired OTP remains an OTP validation error', async () => {
  const { actions } = setup({ otpError: { code: 'otp_expired', status: 403 } });
  assert.equal((await actions.verifySignupOtpAction({ email: 'visitor@example.com', token: '123456' })).stage, 'otp');
});
test('missing member after OTP is an account error and never runs a completion RPC', async () => {
  const { actions } = setup({ access: { status: 'missing' } });
  const result = await actions.verifySignupOtpAction({ email: 'visitor@example.com', token: '123456' });
  assert.equal(result.stage, 'member');
  assert.equal(result.retryable, false);
});
test('verified OTP and an active member return success without a redirect exception', async () => {
  const { actions, calls } = setup();
  assert.deepEqual(await actions.verifySignupOtpAction({
    email: 'visitor@example.com', token: '123456',
  }), { ok: true });
  assert.equal(calls.access, 1);
});
test('active session retry returns success without validating an OTP again', async () => {
  const { actions, calls } = setup();
  assert.deepEqual(await actions.retrySignupMemberAction(), { ok: true });
  assert.equal(calls.otp.length, 0);
});
test('resend uses the signup endpoint and validates the email first', async () => {
  const { actions, calls } = setup();
  assert.equal((await actions.resendSignupOtpAction({ email: 'bad' })).ok, false);
  assert.equal((await actions.resendSignupOtpAction({ email: ' visitor@example.com ' })).ok, true);
  assert.deepEqual(calls.resend, [{ type: 'signup', email: 'visitor@example.com' }]);
});
