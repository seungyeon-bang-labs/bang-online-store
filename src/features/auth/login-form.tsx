'use client';

import { useTransition } from 'react';
import { Mail } from 'lucide-react';
import { loginAction } from '@/actions/login';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginFormSchema } from '@/shared/lib/form-schemas';
import { InputError } from '@/shared/components/ui/input';
import { FormSubmitButton } from '@/shared/components/ui/button'
import { useState } from 'react';
import { IconInput } from '@/shared/components/common/icon-input';
import { PasswordInput } from '@/shared/components/common/password-input';

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof loginFormSchema>) => {
    setServerError(null);

    startTransition(async () => {
      const result = await loginAction(data);

      if (!result.ok) {
        setServerError(result.errorMessage);
      } else {
        // TODO: 로그인 성공 처리 (리다이렉트 등)
        console.log('로그인 성공');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <IconInput
          placeholder="이메일"
          type="email"
          icon={Mail}
          register={register('email')}
          disabled={isPending}
          ariaInvalid={!!errors.email}
        />
        <InputError message={errors.email?.message} />
      </div>
      <div>
        <PasswordInput
          register={register('password')}
          disabled={isPending}
          ariaInvalid={!!errors.password}
          placeholder="비밀번호"
        />
        <InputError message={errors.password?.message} />
      </div>

      <InputError message={serverError ?? undefined} className="text-center" />

      <FormSubmitButton isPending={isPending}>로그인</FormSubmitButton>
    </form>
  );
}
