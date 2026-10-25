'use client';

import { Mail } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginFormSchema, type LoginFormInput } from '@/domains/auth/schema';
import { InputError } from '@/shared/components/ui/input';
import { FormSubmitButton } from '@/shared/components/ui/button';
import { IconInput } from '@/shared/components/common/icon-input';
import { PasswordInput } from '@/shared/components/common/password-input';
import { loginAction } from '@/app/(auth)/actions';
import { unstable_rethrow } from 'next/navigation';

interface LoginFormProps {
  demoAccount?: LoginFormInput;
}

export function LoginForm({ demoAccount }: LoginFormProps) {
  const defaultValues = demoAccount ?? { email: '', password: '' };
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async values => {
    try {
      // Success redirects on the server, which also renders CartBoundary with the new session.
      const result = await loginAction(values);
      setError('root', { message: result.message });
    } catch (error) {
      unstable_rethrow(error);
      setError('root', {
        message: '로그인 요청을 처리하지 못했습니다. 다시 시도해주세요.',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {demoAccount && (
        <div
          role="status"
          className="rounded-md border bg-muted px-4 py-3 text-sm leading-6 text-foreground"
        >
          <p className="font-semibold">데모 안내</p>
          <p>데모 계정으로 로그인하고 쇼핑몰을 둘러보세요.</p>
        </div>
      )}
      <div>
        <IconInput
          placeholder="이메일"
          type="email"
          icon={Mail}
          register={register('email')}
          defaultValue={defaultValues.email}
          ariaInvalid={!!errors.email}
        />
        <InputError message={errors.email?.message} />
      </div>
      <div>
        <PasswordInput
          register={register('password')}
          defaultValue={defaultValues.password}
          ariaInvalid={!!errors.password}
          placeholder="비밀번호"
        />
        <InputError message={errors.password?.message} />
      </div>

      <InputError message={errors.root?.message} />
      <FormSubmitButton isPending={isSubmitting}>로그인</FormSubmitButton>
    </form>
  );
}
