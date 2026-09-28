'use client';

import { useTransition } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmailVerification } from '@/features/auth/email-verification';
import { FormSubmitButton } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';
import { findPasswordFormSchema } from '@/shared/lib/form-schemas';
import { IconInput } from '@/shared/components/common/icon-input';
import { User } from 'lucide-react';
import { AccountRecoveryLinks } from '@/features/auth/account-recovery-links';

function Page() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof findPasswordFormSchema>>({
    resolver: zodResolver(findPasswordFormSchema),
    defaultValues: {
      userid: '',
      email: '',
      isEmailVerified: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof findPasswordFormSchema>) => {
    startTransition(async () => {
      try {
        // TODO: 비밀번호 찾기 요청 API 호출
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('비밀번호 찾기 요청:', data);
      } catch {
        // TODO: 에러 처리
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          <EmailVerification
            control={control}
            setValue={setValue}
            ariaInvalid={!!errors.email || !!errors.isEmailVerified}
            disabled={isPending}
          />
          <InputError
            message={errors.email?.message || errors.isEmailVerified?.message}
          />
        </div>

        <FormSubmitButton isPending={isPending}>비밀번호 찾기</FormSubmitButton>
      </form>
      <AccountRecoveryLinks variant="password" />
    </div>
  );
}

export default Page;
