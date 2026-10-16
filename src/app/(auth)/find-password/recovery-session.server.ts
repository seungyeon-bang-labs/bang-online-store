import 'server-only';

import { EncryptJWT, jwtDecrypt } from 'jose';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  PASSWORD_RECOVERY_DURATION_SECONDS,
  type PasswordRecoveryGrant,
} from '@/domains/auth/schema';

const COOKIE_NAME = 'bang-password-recovery';
const MAX_COOKIE_BYTES = 3180;
type CookieStore = Awaited<ReturnType<typeof cookies>>;
const grantSchema = z
  .object({
    purpose: z.literal('password-recovery'),
    userId: z.uuid(),
    email: z.email().max(320),
    refreshToken: z.string().min(1).max(2048),
    expiresAt: z.number().int().positive(),
  })
  .strict();

function recoveryKey() {
  const secret = process.env.PASSWORD_RECOVERY_SECRET?.trim();
  if (!secret || !/^[A-Za-z0-9+/]{43}=$/.test(secret)) {
    throw new Error('비밀번호 복구 서버 설정을 확인해주세요.');
  }
  const key = Buffer.from(secret, 'base64');
  if (key.length !== 32 || key.toString('base64') !== secret) {
    throw new Error('비밀번호 복구 서버 설정을 확인해주세요.');
  }
  return key;
}

export function assertRecoveryConfiguration() {
  recoveryKey();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    throw new Error('비밀번호 복구 서버 설정을 확인해주세요.');
  }
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/find-password',
  };
}

export async function readRecoveryGrant(
  cookieStore?: CookieStore,
): Promise<
  | { status: 'valid'; grant: PasswordRecoveryGrant }
  | { status: 'missing' | 'invalid' }
> {
  const store = cookieStore ?? (await cookies());
  const value = store.get(COOKIE_NAME)?.value;
  if (!value) return { status: 'missing' };
  const key = recoveryKey();
  if (Buffer.byteLength(value) > MAX_COOKIE_BYTES) return { status: 'invalid' };

  try {
    const { payload } = await jwtDecrypt(value, key, {
      keyManagementAlgorithms: ['dir'],
      contentEncryptionAlgorithms: ['A256GCM'],
      requiredClaims: ['exp'],
    });
    const { exp, ...body } = payload;
    const parsed = grantSchema.safeParse(body);
    if (
      !parsed.success ||
      parsed.data.expiresAt <= Date.now() ||
      exp !== Math.floor(parsed.data.expiresAt / 1000)
    ) {
      return { status: 'invalid' };
    }
    return { status: 'valid', grant: parsed.data };
  } catch {
    return { status: 'invalid' };
  }
}

export async function writeRecoveryGrant(
  grant: PasswordRecoveryGrant,
  cookieStore?: CookieStore,
) {
  const store = cookieStore ?? (await cookies());
  const parsed = grantSchema.parse(grant);
  const remaining = parsed.expiresAt - Date.now();
  if (remaining <= 0 || remaining > PASSWORD_RECOVERY_DURATION_SECONDS * 1000) {
    throw new Error('비밀번호 복구 인증이 만료되었습니다.');
  }
  const value = await new EncryptJWT(parsed)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setExpirationTime(Math.floor(parsed.expiresAt / 1000))
    .encrypt(recoveryKey());
  if (Buffer.byteLength(value) > MAX_COOKIE_BYTES) {
    throw new Error('비밀번호 복구 인증 정보를 저장하지 못했습니다.');
  }
  store.set(COOKIE_NAME, value, {
    ...cookieOptions(),
    expires: new Date(parsed.expiresAt),
    maxAge: Math.ceil(remaining / 1000),
  });
}

export async function clearRecoveryGrant(cookieStore?: CookieStore) {
  const store = cookieStore ?? (await cookies());
  store.set(COOKIE_NAME, '', {
    ...cookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}
