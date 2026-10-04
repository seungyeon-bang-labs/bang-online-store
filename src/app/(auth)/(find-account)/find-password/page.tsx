'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EmailVerification } from '@/features/auth/email-verification';
import { FormSubmitButton } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';
import { findPasswordFormSchema } from '@/shared/lib/form-schemas';
import { AccountRecoveryLinks } from '@/features/auth/account-recovery-links';

function Page() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof findPasswordFormSchema>>({
    resolver: zodResolver(findPasswordFormSchema),
    defaultValues: {
      email: '',
      isEmailVerified: false,
    },
  });

  return (
    <div className="flex flex-col gap-3">
      <form className="flex flex-col gap-4">
        <p className="text-sm leading-5 text-zinc-600">
          현재 포트폴리오 데모에서는 비밀번호 재설정을 제공하지 않습니다.
          안내된 데모 계정으로 로그인해 주세요.
        </p>
        <div>
          <EmailVerification
            control={control}
            setValue={setValue}
            ariaInvalid={!!errors.email || !!errors.isEmailVerified}
          />
          <InputError
            message={errors.email?.message || errors.isEmailVerified?.message}
          />
        </div>

        <FormSubmitButton disabled>비밀번호 재설정은 준비 중입니다</FormSubmitButton>
      </form>
      <AccountRecoveryLinks variant="password" />
    </div>
  );
}

export default Page;
