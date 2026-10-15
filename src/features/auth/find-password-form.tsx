'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import {
  findPasswordFormSchema,
  type FindPasswordInput,
  type PasswordRecoveryRequestResult,
} from '@/domains/auth/schema';
import { IconInput } from '@/shared/components/common/icon-input';
import { FormSubmitButton } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';

interface FindPasswordFormProps {
  requestAction: (input: unknown) => Promise<PasswordRecoveryRequestResult>;
  onSent: (email: string, expiresAt: number) => void;
}

export function FindPasswordForm({ requestAction, onSent }: FindPasswordFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FindPasswordInput>({
    resolver: zodResolver(findPasswordFormSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = handleSubmit(async values => {
    try {
      const result = await requestAction(values);
      if (result.status === 'sent') onSent(values.email, result.otpExpiresAt);
      else setError('root', { message: result.message });
    } catch {
      setError('root', {
        message: '발송 결과를 확인하지 못했습니다. 이메일을 확인하거나 잠시 후 다시 시도해주세요.',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">비밀번호 찾기</h2>
      <p className="text-sm leading-5 text-zinc-600">
        비밀번호를 재설정할 이메일 주소를 입력해주세요.
      </p>
      <div>
        <IconInput
          placeholder="이메일"
          type="email"
          icon={Mail}
          register={register('email')}
          ariaInvalid={!!errors.email}
          autoComplete="email"
          disabled={isSubmitting}
          aria-label="가입한 이메일"
        />
        <InputError message={errors.email?.message} />
      </div>

      <InputError message={errors.root?.message} />
      <FormSubmitButton isPending={isSubmitting}>
        인증번호 받기
      </FormSubmitButton>
    </form>
  );
}
