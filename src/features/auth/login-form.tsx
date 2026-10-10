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

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = handleSubmit(async values => {
    const result = await loginAction(values);

    if (result?.error) {
      console.error(result.error);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <IconInput
          placeholder="이메일"
          type="email"
          icon={Mail}
          register={register('email')}
          ariaInvalid={!!errors.email}
        />
        <InputError message={errors.email?.message} />
      </div>
      <div>
        <PasswordInput
          register={register('password')}
          ariaInvalid={!!errors.password}
          placeholder="비밀번호"
        />
        <InputError message={errors.password?.message} />
      </div>

      <FormSubmitButton isPending={isSubmitting}>로그인</FormSubmitButton>
    </form>
  );
}
