'use client';

import { FormSubmitButton } from '@/shared/components/ui/button';
import { Mail, Phone, User } from 'lucide-react';
import { IconInput } from '@/shared/components/common/icon-input';
import { PasswordInput } from '@/shared/components/common/password-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  createSignupFormSchema,
  type SignupFormValues,
} from './signup-form-schema';
import { InputError } from '@/shared/components/ui/input';
import { TermsAgreement } from '@/features/auth/terms-agreement';
import type { SignupTermViewModel } from '@/domains/terms/view-model';

interface SignupFormProps {
  termsViewModel: SignupTermViewModel[];
}

export function SignupForm({ termsViewModel }: SignupFormProps) {
  const termsDefaults = Object.fromEntries(
    termsViewModel.map(item => [item.code, false]),
  ) as Record<string, boolean>;

  const {
    register,
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(createSignupFormSchema(termsViewModel)),
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: '',
      phone_number: '',
      password: '',
      confirmPassword: '',
      email: '',
      agreements: termsDefaults,
    },
  });

  const agreementsErrorMessage = errors.agreements?.message;
  const termsErrorMessage = typeof agreementsErrorMessage === 'string'
    ? agreementsErrorMessage
    : termsViewModel
    .filter(item => item.required)
    .map(item => errors.agreements?.[item.code]?.message)
    .find(Boolean);

  return (
    <form
      onSubmit={event => event.preventDefault()}
      className="flex flex-col gap-5"
    >
      <p className="text-sm leading-5 text-zinc-600">
        현재 포트폴리오 데모에서는 신규 회원가입을 제공하지 않습니다.
      </p>
      <div>
        <IconInput
          id="signup-email"
          aria-label="이메일"
          autoComplete="email"
          placeholder="이메일*"
          type="email"
          icon={Mail}
          register={register('email')}
          ariaInvalid={!!errors.email}
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
        />
        <InputError id="signup-email-error" message={errors.email?.message} />
      </div>

      <div>
        <PasswordInput
          id="signup-password"
          aria-label="비밀번호"
          autoComplete="new-password"
          placeholder="비밀번호*"
          register={register('password')}
          ariaInvalid={!!errors.password}
          aria-describedby={
            errors.password ? 'signup-password-error' : undefined
          }
        />
        <InputError
          id="signup-password-error"
          message={errors.password?.message}
        />
      </div>

      <div>
        <PasswordInput
          id="signup-confirm-password"
          aria-label="비밀번호 확인"
          autoComplete="new-password"
          placeholder="비밀번호 확인*"
          register={register('confirmPassword')}
          ariaInvalid={!!errors.confirmPassword}
          aria-describedby={
            errors.confirmPassword ? 'signup-confirm-password-error' : undefined
          }
        />
        <InputError
          id="signup-confirm-password-error"
          message={errors.confirmPassword?.message}
        />
      </div>

      <div>
        <IconInput
          id="signup-name"
          autoComplete="name"
          placeholder="이름*"
          aria-label="이름"
          icon={User}
          register={register('name')}
          ariaInvalid={!!errors.name}
          aria-describedby={errors.name ? 'signup-name-error' : undefined}
        />
        <InputError id="signup-name-error" message={errors.name?.message} />
      </div>
      <div>
        <IconInput
          id="signup-phone"
          autoComplete="tel-national"
          inputMode="tel"
          placeholder="휴대폰 번호* (예: 01012345678)"
          aria-label="휴대폰 번호"
          icon={Phone}
          register={register('phone_number')}
          ariaInvalid={!!errors.phone_number}
          aria-describedby={
            errors.phone_number ? 'signup-phone-error' : undefined
          }
        />
        <InputError
          id="signup-phone-error"
          message={errors.phone_number?.message}
        />
      </div>

      {termsViewModel.length > 0 && (
        <div>
          <TermsAgreement
            termsViewModel={termsViewModel}
            control={control}
            setValue={setValue}
            trigger={trigger}
            ariaInvalid={!!termsErrorMessage}
            errorId={termsErrorMessage ? 'signup-terms-error' : undefined}
          />
          <InputError id="signup-terms-error" message={termsErrorMessage} />
        </div>
      )}

      <FormSubmitButton disabled>회원가입은 준비 중입니다</FormSubmitButton>
    </form>
  );
}
