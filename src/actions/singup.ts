'use server';

import { z } from 'zod';
import { loginFormSchema } from '@/lib/form-schemas';

export type LoginActionState =
  | { ok: true; errorMessage?: never }
  | { ok: false; errorMessage: string };

export async function loginAction(
  formData: z.infer<typeof loginFormSchema>
): Promise<LoginActionState> {
  // 로딩 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 2000));

  const result = loginFormSchema.safeParse(formData);

  if (!result.success) {
    return {
      ok: false,
      errorMessage: '아이디 또는 비밀번호가 올바르지 않습니다.',
    };
  }

  const { userid, password } = result.data;

  console.log('Login attempt:', { userid, password });

  // TODO: 실제 인증 로직 구현
  // 임시로 항상 실패하도록 설정
  return {
    ok: false,
    errorMessage: '아이디 또는 비밀번호가 올바르지 않습니다.',
  };
}