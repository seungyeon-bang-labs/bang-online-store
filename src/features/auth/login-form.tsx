'use client';

import { Mail } from 'lucide-react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { loginFormSchema } from '@/shared/lib/form-schemas';
import { InputError } from '@/shared/components/ui/input';
import { FormSubmitButton } from '@/shared/components/ui/button';
import { IconInput } from '@/shared/components/common/icon-input';
import { PasswordInput } from '@/shared/components/common/password-input';

export function LoginForm() {
  const {
    register,
    formState: { errors },
  } = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <form onSubmit={event => event.preventDefault()} className="flex flex-col gap-5">
      <p className="text-sm leading-5 text-zinc-600">
        로그인 기능은 준비 중입니다.
      </p>
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

      <FormSubmitButton disabled>로그인은 준비 중입니다</FormSubmitButton>
    </form>
  );
}
