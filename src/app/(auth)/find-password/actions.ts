'use server';

import { cookies } from 'next/headers';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import { getAuthFeatureRestriction } from '@/domains/auth/feature-policy.server';
import {
  findPasswordFormSchema, passwordRecoveryOtpSchema, resetPasswordFormSchema,
  type PasswordRecoveryRequestResult,
  type PasswordRecoveryVerificationResult,
  type PasswordResetResult,
} from '@/domains/auth/schema';
import {
  requestPasswordRecovery, verifyPasswordRecoveryOtp,
  restorePasswordRecovery, resetRecoveredPassword,
} from '@/domains/auth/password-recovery.server';
import {
  assertRecoveryConfiguration, readRecoveryGrant,
  writeRecoveryGrant, clearRecoveryGrant,
} from './recovery-session.server';

const restart = {
  status: 'restart' as const,
  message: '복구 인증 정보를 확인하지 못했습니다. 처음부터 다시 진행해주세요.',
};
const failure = {
  status: 'error' as const,
  message: '비밀번호 복구 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
};
type CookieStore = Awaited<ReturnType<typeof cookies>>;

async function ordinarySessionMessage(client: Awaited<ReturnType<typeof createAuthClient>>) {
  try {
    const { data: { user }, error } = await client.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError' &&
      error.status !== 401 && error.status !== 403) {
      return '로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.';
    }
    return user?.email_confirmed_at
      ? '로그아웃한 후 비밀번호 찾기를 이용해주세요.'
      : null;
  } catch {
    return '로그인 상태를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.';
  }
}

async function finish(
  result: { status: 'error' | 'restart'; message: string },
  store: CookieStore,
): Promise<{ status: 'error' | 'restart'; message: string }>;
async function finish(result: PasswordResetResult, store: CookieStore): Promise<PasswordResetResult>;
async function finish(
  result: PasswordResetResult,
  store: CookieStore,
): Promise<PasswordResetResult> {
  if (result.status === 'error') return result;
  try {
    await clearRecoveryGrant(store);
    return result;
  } catch {
    if (result.status === 'unknown') return result;
    if (result.status === 'success' || result.status === 'partial_success') {
      return {
        status: 'partial_success',
        message: (result.status === 'success' ? '비밀번호는 변경되었습니다.' : result.message) +
          ' 임시 인증 정보 정리를 확인하지 못했습니다.',
      };
    }
    return {
      status: 'restart',
      message: result.message + ' 임시 인증 정보 정리를 확인하지 못했습니다.',
    };
  }
}

export async function requestPasswordRecoveryAction(
  input: unknown,
): Promise<PasswordRecoveryRequestResult> {
  const restriction = getAuthFeatureRestriction('passwordRecovery');
  if (restriction) return { status: 'error', ...restriction };

  const parsed = findPasswordFormSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', message: '이메일 주소를 확인해주세요.' };
  const client = await createAuthClient();
  const store = await cookies();
  const message = await ordinarySessionMessage(client);
  if (message) return { status: 'error', message };
  try {
    assertRecoveryConfiguration();
    await clearRecoveryGrant(store);
    return await requestPasswordRecovery(parsed.data.email);
  } catch {
    return failure;
  }
}

export async function verifyPasswordRecoveryOtpAction(
  input: unknown,
): Promise<PasswordRecoveryVerificationResult> {
  const restriction = getAuthFeatureRestriction('passwordRecovery');
  if (restriction) return { status: 'error', ...restriction };

  const parsed = passwordRecoveryOtpSchema.safeParse(input);
  if (!parsed.success) return { status: 'error', message: '이메일과 인증번호 6자리를 확인해주세요.' };
  const client = await createAuthClient();
  const store = await cookies();
  const message = await ordinarySessionMessage(client);
  if (message) return { status: 'error', message };
  try {
    assertRecoveryConfiguration();
    const existing = await readRecoveryGrant(store);
    if (existing.status === 'invalid') {
      return await finish(restart, store);
    }
    if (existing.status === 'valid') {
      if (existing.grant.email.trim().toLowerCase() !== parsed.data.email.toLowerCase()) {
        return await finish(restart, store);
      }
      const restored = await restorePasswordRecovery(existing.grant);
      if (restored.status !== 'ready') {
        return await finish(restored, store);
      }
      try {
        await writeRecoveryGrant(restored.context.grant, store);
      } catch {
        return await finish(restart, store);
      }
      return { status: 'verified', recoveryExpiresAt: restored.context.grant.expiresAt };
    }
    const result = await verifyPasswordRecoveryOtp(parsed.data.email, parsed.data.token);
    if (result.status !== 'verified') return result;
    try {
      await writeRecoveryGrant(result.grant, store);
    } catch {
      return await finish(restart, store);
    }
    return { status: 'verified', recoveryExpiresAt: result.grant.expiresAt };
  } catch {
    return failure;
  }
}

export async function resetPasswordAction(input: unknown): Promise<PasswordResetResult> {
  const restriction = getAuthFeatureRestriction('passwordRecovery');
  if (restriction) return { status: 'error', ...restriction };

  const parsed = resetPasswordFormSchema.safeParse(input);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? '비밀번호를 확인해주세요.' };
  }
  const client = await createAuthClient();
  const store = await cookies();
  const message = await ordinarySessionMessage(client);
  if (message) return { status: 'error', message };
  let changing = false;
  try {
    assertRecoveryConfiguration();
    const existing = await readRecoveryGrant(store);
    if (existing.status !== 'valid') return await finish(restart, store);
    const restored = await restorePasswordRecovery(existing.grant);
    if (restored.status !== 'ready') return await finish(restored, store);
    try {
      await writeRecoveryGrant(restored.context.grant, store);
    } catch {
      return await finish(restart, store);
    }
    changing = true;
    return await finish(
      await resetRecoveredPassword(restored.context, parsed.data.password), store,
    );
  } catch {
    return changing
      ? await finish({
        status: 'unknown',
        message: '비밀번호 변경 결과를 확인하지 못했습니다. 새 비밀번호로 로그인해 확인해주세요.',
      }, store)
      : failure;
  }
}
