'use server';

import { redirect } from 'next/navigation';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import {
  loginFormSchema,
  createSignupFormSchema,
  signupOtpSchema,
  SIGNUP_OTP_LENGTH,
} from '@/domains/auth/schema';
import { termRepository, toSignupTerms } from '@/domains/terms';
import { completeCurrentSignup } from '@/domains/auth/complete-signup.server';

export async function loginAction(input: unknown) {
  const parsed = loginFormSchema.safeParse(input);

  if (!parsed.success) {
    return { error: '이메일과 비밀번호를 확인해주세요' };
  }

  const client = await createAuthClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: '이메일 또는 비밀번호를 확인해주세요' };
  }

  redirect('/');
}

export async function signupAction(
  input: unknown,
): Promise<{ ok: boolean; message: string }> {
  try {
    const terms = await termRepository.findEffective();
    const signupTerms = toSignupTerms(terms);

    if (signupTerms.length === 0) {
      return {
        ok: false,
        message:
          '가입 약관을 확인할 수 없습니다. 페이지를 새로고침한 후 다시 시도해주세요.',
      };
    }

    const schema = createSignupFormSchema(signupTerms);
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        message: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요.',
      };
    }

    const values = parsed.data;

    const agreedTermIds = signupTerms
      .filter(term => values.agreements[term.code])
      .map(term => term.termId);

    const client = await createAuthClient();

    const { error } = await client.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${process.env.SITE_URL}/auth/confirm`,
        data: {
          name: values.name,
          phone_number: values.phone_number.replace(/[\s-]/g, ''),
          agreed_term_ids: agreedTermIds,
        },
      },
    });

    if (error) {
      return {
        ok: false,
        message: '회원가입 요청을 처리하지 못했습니다.',
      };
    }

    return {
      ok: true,
      message: '회원가입 요청이 정상적으로 처리되었습니다.',
    };
  } catch {
    return {
      ok: false,
      message: '회원가입 요청을 처리하지 못했습니다.',
    };
  }
}

export async function verifySignupOtpAction(input: unknown) {
  const parsed = signupOtpSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      stage: 'otp',
      message: `이메일과 인증번호 ${SIGNUP_OTP_LENGTH}자리를 확인해주세요.`,
    };
  }

  const client = await createAuthClient();

  const { error } = await client.auth.verifyOtp({
    type: 'email',
    email: parsed.data.email,
    token: parsed.data.token,
  });

  if (error) {
    return {
      ok: false,
      stage: 'otp',
      message: '인증번호가 올바르지 않거나 만료되었습니다. 다시 시도해주세요.',
    };
  }

  const completion = await completeCurrentSignup();

  if (!completion.ok) {
    return {
      ok: false,
      stage: 'complete',
      message: completion.message,
    };
  }

  redirect('/');
}

export async function resendSignupOtpAction(input: unknown) {
  const parsed = signupOtpSchema.pick({ email: true }).safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: '이메일 주소를 확인해주세요.',
    };
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
      message: '재전송 요청이 처리되었습니다. 이메일을 확인해주세요.',
    };
  } catch {
    return {
      ok: false,
      message: '재전송 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
    };
  }
}
