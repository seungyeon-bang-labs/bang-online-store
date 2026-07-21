'use client';

import { User } from 'lucide-react';
import { FormSubmitButton } from '@/components/ui/button';
import { EmailVerification } from '@/features/auth/email-verification';
import { IconInput, PasswordInput } from '@/features/auth/icon-input';
import { useTransition, useState, useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { signupFormSchema } from '@/lib/form-schemas';
import { InputError } from '@/components/ui/input';
import { TermsAgreement } from '@/features/auth/terms-agreement';
import { type TermsKey } from '@/lib/terms';
import type { Tables } from '@/shared/types/supabase';

export function SignupForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [termCodes, setTermCodes] = useState<Tables<'term_codes'>[]>([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(true);

  useEffect(() => {
    async function fetchTermCodes() {
      try {
        const response = await fetch('/api/auth/term-codes');
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
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof signupFormSchema>>({
    resolver: zodResolver(signupFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      userid: '',
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

  const onSubmit = async (data: z.infer<typeof signupFormSchema>) => {
    setServerError(null);

    startTransition(async () => {
      try {
        // TODO: 회원가입 API 호출
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('회원가입 성공:', data);
      } catch {
        setServerError('회원가입에 실패했습니다. 다시 시도해주세요.');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <IconInput
          placeholder="아이디"
          icon={User}
          register={register('userid')}
          disabled={isPending}
          ariaInvalid={!!errors.userid}
        />
        <InputError message={errors.userid?.message} />
      </div>

      <div>
        <PasswordInput
          placeholder="비밀번호"
          register={register('password')}
          disabled={isPending}
          ariaInvalid={!!errors.password}
        />
        <InputError message={errors.password?.message} />
      </div>

      <div>
        <PasswordInput
          placeholder="비밀번호 확인"
          register={register('confirmPassword')}
          disabled={isPending}
          ariaInvalid={!!errors.confirmPassword}
        />
        <InputError message={errors.confirmPassword?.message} />
      </div>

      <div>
        <EmailVerification
          control={control}
          setValue={setValue}
          disabled={isPending}
        />
        <InputError
          message={errors.email?.message || errors.isEmailVerified?.message}
        />
      </div>

      {isLoadingTerms ? (
        <div className="text-sm text-muted-foreground">약관 로딩 중...</div>
      ) : (
        <div>
          <TermsAgreement
            control={control}
            setValue={setValue}
            disabled={isPending}
            ariaInvalid={!!termsErrorMessage}
          />
          <InputError message={termsErrorMessage ?? undefined} />
        </div>
      )}

      <InputError message={serverError ?? undefined} className="text-center" />

      <FormSubmitButton isPending={isPending}>회원가입</FormSubmitButton>
    </form>
  );
}
