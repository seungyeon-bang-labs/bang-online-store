import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';
import { createEphemeralServerClient } from '@/shared/lib/supabase/ephemeral-server';
import { createMemberAccessService } from './member-access.server';
import { createMemberAccessRepository } from '@/domains/member/supabase-repository.server';
import {
  PASSWORD_RECOVERY_DURATION_SECONDS,
  type PasswordRecoveryGrant,
  type PasswordRecoveryRequestResult,
  type PasswordResetResult,
} from './schema';

export type RecoveredPasswordContext = {
  client: SupabaseClient<Database>;
  grant: PasswordRecoveryGrant;
};

type RecoveryFailure = { status: 'error' | 'restart'; message: string };

const restart: RecoveryFailure = {
  status: 'restart',
  message:
    '비밀번호 복구 인증이 만료되었거나 유효하지 않습니다. 처음부터 다시 진행해주세요.',
};

const readFailure: RecoveryFailure = {
  status: 'error',
  message: '인증 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.',
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

function isTransient(error: { status?: number; name?: string }) {
  return (
    error.name === 'AuthRetryableFetchError' ||
    (error.status !== undefined && error.status >= 500)
  );
}

export async function requestPasswordRecovery(
  email: string,
): Promise<PasswordRecoveryRequestResult> {
  const client = createEphemeralServerClient();
  const otpExpiresAt = Date.now() + PASSWORD_RECOVERY_DURATION_SECONDS * 1000;
  const failure = {
    status: 'error' as const,
    message:
      '인증번호 발송 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
  };

  try {
    const { error } = await client.auth.resetPasswordForEmail(email);

    return error ? failure : { status: 'sent', otpExpiresAt };
  } catch {
    return failure;
  }
}

export async function verifyPasswordRecoveryOtp(
  email: string,
  token: string,
): Promise<
  { status: 'verified'; grant: PasswordRecoveryGrant } | RecoveryFailure
> {
  const client = createEphemeralServerClient();

  try {
    const { data, error } = await client.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (error) {
      return {
        status: 'error',
        message: isTransient(error)
          ? '인증 결과를 확인하지 못했습니다. 다시 확인하거나 새 인증번호를 받아주세요.'
          : '인증번호가 올바르지 않거나 만료되었습니다.',
      };
    }

    const { user, session } = data;

    if (
      !user?.email ||
      !session?.refresh_token ||
      normalizeEmail(user.email) !== normalizeEmail(email)
    )
      return restart;
    return {
      status: 'verified',
      grant: {
        purpose: 'password-recovery',
        userId: user.id,
        email: user.email,
        refreshToken: session.refresh_token,
        expiresAt: Date.now() + PASSWORD_RECOVERY_DURATION_SECONDS * 1000,
      },
    };
  } catch {
    return {
      status: 'error',
      message:
        '인증 결과를 확인하지 못했습니다. 다시 확인하거나 새 인증번호를 받아주세요.',
    };
  }
}

export async function restorePasswordRecovery(
  grant: PasswordRecoveryGrant,
): Promise<
  { status: 'ready'; context: RecoveredPasswordContext } | RecoveryFailure
> {
  if (grant.expiresAt <= Date.now()) return restart;
  const client = createEphemeralServerClient();
  try {
    const { data, error } = await client.auth.refreshSession({
      refresh_token: grant.refreshToken,
    });
    if (error) return isTransient(error) ? readFailure : restart;
    if (
      !data.user?.email ||
      !data.session?.refresh_token ||
      data.user.id !== grant.userId ||
      normalizeEmail(data.user.email) !== normalizeEmail(grant.email) ||
      grant.expiresAt <= Date.now()
    )
      return restart;
    return {
      status: 'ready',
      context: {
        client,
        grant: { ...grant, refreshToken: data.session.refresh_token },
      },
    };
  } catch {
    return readFailure;
  }
}

export async function resetRecoveredPassword(
  { client, grant }: RecoveredPasswordContext,
  password: string,
): Promise<PasswordResetResult> {
  if (grant.expiresAt <= Date.now()) return restart;
  const access = await createMemberAccessService(
    client,
    createMemberAccessRepository(client),
  ).findCurrent();
  if (access.status === 'error') return readFailure;
  if (access.status !== 'active' || access.member.id !== grant.userId) {
    return {
      status: 'restart',
      message:
        access.status === 'missing'
          ? '회원 정보를 확인할 수 없습니다. 관리자에게 문의해주세요.'
          : '이용할 수 없는 회원 계정이거나 인증 정보가 유효하지 않습니다.',
    };
  }
  if (grant.expiresAt <= Date.now()) return restart;

  const unknown: PasswordResetResult = {
    status: 'unknown',
    message:
      '비밀번호 변경 결과를 확인하지 못했습니다. 새 비밀번호로 로그인해 확인해주세요.',
  };
  try {
    const { error } = await client.auth.updateUser({ password });
    if (error) {
      if (isTransient(error)) return unknown;
      if (error.status === 401 || error.status === 403) return restart;
      return {
        status: 'error',
        message:
          error.code === 'same_password'
            ? '기존 비밀번호와 다른 비밀번호를 입력해주세요.'
            : '비밀번호를 변경하지 못했습니다. 비밀번호를 확인하고 다시 시도해주세요.',
      };
    }
  } catch {
    return unknown;
  }

  const partial: PasswordResetResult = {
    status: 'partial_success',
    message:
      '비밀번호는 변경되었습니다. 모든 기기의 로그아웃 처리를 확인하지 못했습니다.',
  };
  try {
    const { data, error: sessionError } = await client.auth.getSession();
    if (sessionError || !data.session?.access_token) return partial;
    // signOut()이 삼키는 401·403·404도 현재 사용자의 JWT로 확인합니다.
    const { error } = await client.auth.admin.signOut(
      data.session.access_token,
      'global',
    );
    return error ? partial : { status: 'success' };
  } catch {
    return partial;
  }
}
