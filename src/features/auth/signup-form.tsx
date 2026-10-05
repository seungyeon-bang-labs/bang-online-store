'use client';

import { FormSubmitButton } from '@/shared/components/ui/button';
import { EmailVerification } from '@/features/auth/email-verification';
import { PasswordInput } from '@/shared/components/common/password-input';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signupFormSchema } from '@/shared/lib/form-schemas';
import { InputError } from '@/shared/components/ui/input';
import { TermsAgreement } from '@/features/auth/terms-agreement';
import { type TermsKey } from '@/shared/lib/terms';
import type { Tables } from '@/shared/types/supabase';

export function SignupForm() {
  const [termCodes, setTermCodes] = useState<Tables<'term_codes'>[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);

  useEffect(() => {
    async function fetchTermCodes() {
      try {
        const response = await fetch('/api/auth/term_codes');
        const result = await response.json();
        if (response.ok && result.termsCodes) {
          setTermCodes(result.termsCodes);
        }
      } catch (error) {
        console.error('Failed to fetch term codes:', error);
      } finally {
        setIsLoadingTerms(false);
      }
    }
    fetchTermCodes();
  }, []);

  const termsDefaults = Object.fromEntries(
    termCodes.map(item => [item.code, false]),
  ) as Record<TermsKey, boolean>;

  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      password: '',
      confirmPassword: '',
      email: '',
      isEmailVerified: false,
      ...termsDefaults,
    },
  });

  const termsErrorMessage = termCodes
    .filter(item => item.is_required)
    .map(item => errors[item.code as TermsKey]?.message)
    .find(Boolean);

  return (
    <form className="flex flex-col gap-5">
      <p className="text-sm leading-5 text-zinc-600">
        현재 포트폴리오 데모에서는 신규 회원가입을 제공하지 않습니다.
      </p>
      <div>
        <EmailVerification control={control} setValue={setValue} />
        <InputError
          message={errors.email?.message || errors.isEmailVerified?.message}
        />
      </div>

      <div>
        <PasswordInput
          placeholder="비밀번호"
          register={register('password')}
          ariaInvalid={!!errors.password}
        />
        <InputError message={errors.password?.message} />
      </div>

      <div>
        <PasswordInput
          placeholder="비밀번호 확인"
          register={register('confirmPassword')}
          ariaInvalid={!!errors.confirmPassword}
        />
        <InputError message={errors.confirmPassword?.message} />
      </div>

      {isLoadingTerms ? (
        <div className="text-sm text-muted-foreground">약관 로딩 중...</div>
      ) : (
        <div>
          <TermsAgreement
            control={control}
            setValue={setValue}
            ariaInvalid={!!termsErrorMessage}
          />
          <InputError message={termsErrorMessage ?? undefined} />
        </div>
      )}

      <FormSubmitButton disabled>
        회원가입은 준비 중입니다
      </FormSubmitButton>
    </form>
  );
}
