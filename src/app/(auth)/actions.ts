'use server';

import { redirect, RedirectType } from 'next/navigation';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import { getAuthFeatureRestriction } from '@/domains/auth/feature-policy.server';
import {
  loginFormSchema,
  createSignupRequestSchema,
  signupOtpSchema,
  SIGNUP_OTP_LENGTH,
  type AuthFeatureRestriction,
} from '@/domains/auth/schema';
import { termRepository, toSignupTerms } from '@/domains/terms';
import {
  getCurrentMemberAccess,
  type MemberAccessResult,
} from '@/domains/auth/member-access.server';

export type LoginResult =
  | { status: 'success' }
  | { status: 'error'; message: string }
  | { status: 'verification_required'; email: string };

export type SignupMemberFailure = {
  ok: false;
  stage: 'member';
  retryable: boolean;
  message: string;
};
export type SignupMemberResult = { ok: true } | SignupMemberFailure;

export type SignupVerificationResult =
  | { ok: false; stage: 'otp'; message: string; reason?: AuthFeatureRestriction['reason'] }
  | SignupMemberResult;

const accessMessages = {
  unauthenticated: '로그인 세션을 확인할 수 없습니다. 다시 로그인해주세요.',
  unverified: '이메일 인증이 필요합니다. 로그인 화면에서 인증을 이어가주세요.',
  unavailable: '이용할 수 없는 회원 계정입니다.',
  missing: '회원 정보가 확인되지 않습니다. 관리자에게 문의해주세요.',
  error: '회원 정보를 확인하지 못했습니다. 다시 시도해주세요.',
} satisfies Record<Exclude<MemberAccessResult['status'], 'active'>, string>;

const signupRecoveryMessage =
  '회원가입 결과를 확인하지 못했습니다. 이메일을 확인하거나 로그인 화면에서 인증을 이어가주세요.';

export async function logoutAction(): Promise<{ message: string } | null> {
  const client = await createAuthClient();
  const failure = { message: '로그아웃하지 못했습니다. 다시 시도해주세요.' };

  try {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) return failure;
  } catch {
    return failure;
  }

  redirect('/', RedirectType.replace);
}

export async function loginAction(input: unknown): Promise<LoginResult> {
  const parsed = loginFormSchema.safeParse(input);

  if (!parsed.success) {
    return { status: 'error', message: '이메일과 비밀번호를 확인해주세요.' };
  }

  const client = await createAuthClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error?.code === 'email_not_confirmed') {
    return { status: 'verification_required', email: parsed.data.email };
  }
  if (error) {
    return {
      status: 'error',
      message: '이메일 또는 비밀번호를 확인해주세요.',
    };
  }

  const access = await getCurrentMemberAccess();

  if (access.status === 'unverified') {
    return { status: 'verification_required', email: access.email };
  }
  if (access.status !== 'active') {
    return { status: 'error', message: accessMessages[access.status] };
  }
  return { status: 'success' };
}

export async function signupAction(
  input: unknown,
): Promise<{ ok: boolean; message: string; reason?: AuthFeatureRestriction['reason'] }> {
  const restriction = getAuthFeatureRestriction('signup');
  if (restriction) return { ok: false, ...restriction };

  const terms = toSignupTerms(await termRepository.findEffective());

  if (terms.length === 0) {
    return {
      ok: false,
      message: '가입 약관을 확인할 수 없습니다. 페이지를 새로고침해주세요.',
    };
  }

  const parsed = createSignupRequestSchema(terms).safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.',
    };
  }

  const values = parsed.data;
  const client = await createAuthClient();
  const { error } = await client.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: {
        name: values.name,
        phone_number: values.phone_number.replace(/[\s-]/g, ''),
        agreed_term_ids: terms
          .filter(term => values.agreements[term.code])
          .map(term => term.termId),
        displayed_term_ids: values.displayed_term_ids,
      },
    },
  });

  if (
    error?.name === 'AuthRetryableFetchError' ||
    (error?.status !== undefined && error.status >= 500)
  ) {
    return { ok: false, message: signupRecoveryMessage };
  }

  if (error) {
    return {
      ok: false,
      message:
        '회원가입 요청을 처리하지 못했습니다. 입력 정보를 확인하고 다시 시도해주세요.',
    };
  }

  return {
    ok: true,
    message: '회원가입 요청이 처리되었습니다. 이메일을 확인해주세요.',
  };
}

export async function verifySignupOtpAction(
  input: unknown,
): Promise<SignupVerificationResult> {
  const restriction = getAuthFeatureRestriction('emailVerification');
  if (restriction) return { ok: false, stage: 'otp', ...restriction };

  const parsed = signupOtpSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      stage: 'otp',
      message: `이메일과 인증번호 ${SIGNUP_OTP_LENGTH}자리를 확인해주세요.`,
    };
  }

  try {
    const client = await createAuthClient();
    const { error } = await client.auth.verifyOtp({
      type: 'email',
      ...parsed.data,
    });

    if (error) {
      if (
        error.name === 'AuthRetryableFetchError' ||
        (error.status !== undefined && error.status >= 500)
      ) {
        return {
          ok: false,
          stage: 'member',
          retryable: true,
          message:
            '인증 결과를 확인하지 못했습니다. 회원 상태를 다시 확인해주세요.',
        };
      }

      return {
        ok: false,
        stage: 'otp',
        message: '인증번호가 올바르지 않거나 만료되었습니다.',
      };
    }
  } catch {
    return {
      ok: false,
      stage: 'member',
      retryable: true,
      message:
        '인증 결과를 확인하지 못했습니다. 회원 상태를 다시 확인해주세요.',
    };
  }

  return retrySignupMemberAction();
}

export async function retrySignupMemberAction(): Promise<SignupMemberResult> {
  const access = await getCurrentMemberAccess();

  if (access.status === 'active') return { ok: true };

  return {
    ok: false,
    stage: 'member',
    retryable: access.status === 'error',
    message: accessMessages[access.status],
  };
}

export async function resendSignupOtpAction(
  input: unknown,
): Promise<{ ok: boolean; message: string; reason?: AuthFeatureRestriction['reason'] }> {
  const restriction = getAuthFeatureRestriction('emailVerification');
  if (restriction) return { ok: false, ...restriction };

  const parsed = signupOtpSchema.pick({ email: true }).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: '이메일 주소를 확인해주세요.' };
  }

  try {
    const client = await createAuthClient();
    const { error } = await client.auth.resend({
      type: 'signup',
      email: parsed.data.email,
    });

    if (error) {
      return {
        ok: false,
        message: '인증번호를 재전송하지 못했습니다. 잠시 후 다시 시도해주세요.',
      };
    }

    return {
      ok: true,
      message: '발송 요청이 처리되었습니다. 이메일을 확인해주세요.',
    };
  } catch {
    return {
      ok: false,
      message: '발송 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}
