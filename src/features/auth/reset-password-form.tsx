'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
  type PasswordResetResult,
} from '@/domains/auth/schema';
import { PasswordInput } from '@/shared/components/common/password-input';
import { InputError } from '@/shared/components/ui/input';
import { FormSubmitButton } from '@/shared/components/ui/button';

interface ResetPasswordFormProps {
  resetAction: (input: unknown) => Promise<PasswordResetResult>;
  onResult: (result: Exclude<PasswordResetResult, { status: 'error' }>) => void;
}

export function ResetPasswordForm({
  resetAction,
  onResult,
}: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async values => {
    try {
      const result = await resetAction(values);
      if (result.status === 'error')
        setError('root', { message: result.message });
      else onResult(result);
    } catch {
      onResult({
        status: 'unknown',
        message:
          '비밀번호 변경 결과를 확인하지 못했습니다. 새 비밀번호로 로그인해 확인해주세요.',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">새 비밀번호 설정</h2>
      <p className="text-sm leading-5 text-zinc-600">
        인증 후 5분 안에 새 비밀번호를 설정해주세요.
      </p>
      <div>
        <PasswordInput
          placeholder="새 비밀번호"
          aria-label="새 비밀번호"
          autoComplete="new-password"
          register={register('password')}
          ariaInvalid={!!errors.password}
          disabled={isSubmitting}
        />
        <InputError message={errors.password?.message} />
      </div>
      <div>
        <PasswordInput
          placeholder="새 비밀번호 확인"
          aria-label="새 비밀번호 확인"
          autoComplete="new-password"
          register={register('confirmPassword')}
          ariaInvalid={!!errors.confirmPassword}
          disabled={isSubmitting}
        />
        <InputError message={errors.confirmPassword?.message} />
      </div>
      <InputError message={errors.root?.message} />
      <FormSubmitButton isPending={isSubmitting}>
        비밀번호 변경
      </FormSubmitButton>
    </form>
  );
}
