import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js/min';
import type { SignupTermViewModel } from '@/domains/terms/view-model';

export function createSignupFormSchema(terms: readonly SignupTermViewModel[]) {
  const knownCodes = new Set(terms.map(term => term.code));

  return z
    .object({
      name: z.string().trim().min(1, '이름을 입력해주세요.').pipe(
        z.string().max(50, '이름은 50자 이하로 입력해주세요.'),
      ),
      phone_number: z.string().trim().min(1, '휴대폰 번호를 입력해주세요.').pipe(
        z.string().refine(
          value => /^01[016789]/.test(value.replace(/[\s-]/g, '')) && isValidPhoneNumber(value, 'KR'),
          { message: '유효한 휴대폰 번호를 입력해주세요.' },
        ),
      ),
      password: z.string().min(1, '비밀번호를 입력해주세요.').pipe(
        z.string().superRefine((value, ctx) => {
          const reject = (message: string) => ctx.addIssue({ code: 'custom', message });
          if (value.length < 8 || value.length > 20) {
            reject('비밀번호는 8자 이상, 최대 20자 이하여야 합니다.');
            return;
          }
          if (/\s/.test(value)) {
            reject('비밀번호에 공백을 포함할 수 없습니다.');
            return;
          }
          if (!/^[\x21-\x7E]+$/.test(value)) {
            reject('비밀번호는 영문, 숫자, ASCII 특수문자만 사용할 수 있습니다.');
            return;
          }
          const kinds = [/[A-Za-z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)];
          if (kinds.filter(Boolean).length < 2) {
            reject('비밀번호는 영문, 숫자, 특수문자 중 2가지 이상 포함해야 합니다.');
          }
        }),
      ),
      confirmPassword: z.string().min(1, '비밀번호를 확인해주세요.'),
      email: z.string().trim().min(1, '이메일을 입력해주세요.').pipe(
        z.email('유효한 이메일 주소를 입력해주세요.'),
      ),
      agreements: z.record(z.string(), z.boolean()).superRefine((values, ctx) => {
        for (const code of Object.keys(values)) {
          if (!knownCodes.has(code)) {
            ctx.addIssue({ code: 'custom', message: '약관 정보를 확인할 수 없습니다. 페이지를 새로고침한 후 다시 시도해주세요.' });
          }
        }
        for (const term of terms) {
          if (term.required && values[term.code] !== true) {
            ctx.addIssue({ code: 'custom', path: [term.code], message: `'${term.label}'에 동의해주세요.` });
          }
        }
      }),
    })
    .refine(data => !data.password || !data.confirmPassword || data.password === data.confirmPassword, {
      message: '비밀번호가 일치하지 않습니다.',
      path: ['confirmPassword'],
    });
}

export type SignupFormValues = z.infer<ReturnType<typeof createSignupFormSchema>>;
