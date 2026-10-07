import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.email('유효한 이메일 주소를 입력해주세요.'),
  password: z.string().trim().min(1, '비밀번호를 입력해주세요.'),
});

export const findPasswordFormSchema = z.object({
  email: z.email('유효한 이메일 주소를 입력해주세요.'),
});
