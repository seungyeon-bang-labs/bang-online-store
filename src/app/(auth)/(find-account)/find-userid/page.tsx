'use client';

import { useTransition } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmailVerification } from '@/features/auth/email-verification';
import { FormSubmitButton } from '@/components/ui/button';
import { InputError } from '@/components/ui/input';
import { findUseridFormSchema } from '@/lib/form-schemas';
import { AccountRecoveryLinks } from '@/features/auth/account-recovery-links';

function Page() {
  const [isPending, startTransition] = useTransition();

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof findUseridFormSchema>>({
    resolver: zodResolver(findUseridFormSchema),
    defaultValues: {
      email: '',
      isEmailVerified: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof findUseridFormSchema>) => {
    startTransition(async () => {
      try {
        // TODO: 아이디 찾기 요청 API 호출
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('아이디 찾기 요청:', data);
      } catch {
        // TODO: 에러 처리
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

        <FormSubmitButton isPending={isPending}>아이디 찾기</FormSubmitButton>
      </form>
      <AccountRecoveryLinks variant="userid" />
    </div>
  );
}

export default Page;
