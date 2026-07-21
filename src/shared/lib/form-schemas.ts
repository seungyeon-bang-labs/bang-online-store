import { z } from 'zod';
import { termsAcceptedData } from '@/lib/terms';

export const loginFormSchema = z.object({
  userid: z.string().trim().min(1, '아이디를 입력해주세요.'),
  password: z.string().trim().min(1, '비밀번호를 입력해주세요.'),
});

const termsAcceptedSchema = Object.fromEntries(
  termsAcceptedData.map(item => [
    item.id,
    item.type === 'essential'
      ? z.boolean().refine(value => value, {
          message: `'${item.label}'에 동의해주세요.`,
        })
      : z.boolean(),
  ]),
);

export const signupFormSchema = z
  .object({
    userid: z
      .string()
      .trim()
      .min(1, '아이디를 입력해주세요.')
      .min(4, '아이디는 4자 이상, 쵀대 12자 이하여야 합니다.')
      .max(12, '아이디는 4자 이상, 쵀대 12자 이하여야 합니다.')
      .regex(/^\S+$/, {
        message: '아이디에 공백을 포함할 수 없습니다.',
      })
      .regex(/^(?=.*[a-z])[a-z0-9]+$/, {
        message:
          '아이디는 영문 소문자, 숫자를 사용 가능하며, 영문자 1자 이상 포함해야 합니다.',
      }),
    password: z
      .string()
      .trim()
      .min(1, '비밀번호를 입력해주세요.')
      .min(8, '비밀번호는 8자 이상, 쵀대 20자 이하여야 합니다.')
      .max(20, '비밀번호는 8자 이상, 쵀대 20자 이하여야 합니다.')
      .regex(/^\S+$/, {
        message: '비밀번호에 공백을 포함할 수 없습니다.',
      })
      .refine(
        value => {
          const hasLetter = /[A-Za-z]/.test(value);
          const hasNumber = /\d/.test(value);
          const hasSpecial = /[^A-Za-z\d]/.test(value);
          const count = [hasLetter, hasNumber, hasSpecial].filter(
            Boolean,
          ).length;
          return count >= 2;
        },
        {
          message:
            '비밀번호는 영문, 숫자, 특수문자 중 2가지 이상 포함해야 합니다.',
        },
      ),
    confirmPassword: z.string().trim().min(1, '비밀번호를 확인해주세요.'),
    email: z.email('유효한 이메일 주소를 입력해주세요.'),
    isEmailVerified: z
      .boolean()
      .refine(value => value, { message: '이메일 인증을 완료해주세요.' }),
    ...(termsAcceptedSchema as Record<
      (typeof termsAcceptedData)[number]['id'],
      z.ZodBoolean
    >),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export const findUseridFormSchema = z.object({
  email: z.email('유효한 이메일 주소를 입력해주세요.'),
  isEmailVerified: z
    .boolean()
    .refine(value => value, { message: '이메일 인증을 완료해주세요.' }),
});

export const findPasswordFormSchema = z.object({
  userid: z.string().trim().min(1, '아이디를 입력해주세요.'),
  email: z.email('유효한 이메일 주소를 입력해주세요.'),
  isEmailVerified: z
    .boolean()
    .refine(value => value, { message: '이메일 인증을 완료해주세요.' }),
});
