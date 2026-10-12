'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { IconInput } from '@/shared/components/common/icon-input';
import { ButtonLink, FormSubmitButton } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';
import { Separator } from '@/shared/components/ui/separator';
import {
  findPasswordFormSchema,
  type FindPasswordInput,
} from '@/domains/auth/schema';
import { AuthSecondaryLink } from '@/features/auth/auth-secondary-link';

function Page() {
  const {
    register,
    formState: { errors },
  } = useForm<FindPasswordInput>({
    resolver: zodResolver(findPasswordFormSchema),
    defaultValues: {
      email: '',
    },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <form
          onSubmit={event => event.preventDefault()}
          className="flex flex-col gap-4"
        >
          <p className="text-sm leading-5 text-zinc-600">
            현재 포트폴리오 데모에서는 비밀번호 재설정을 제공하지 않습니다.
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

          <FormSubmitButton disabled>
            비밀번호 재설정은 준비 중입니다
          </FormSubmitButton>
        </form>
        <AuthSecondaryLink variant="password" />
      </div>

      <div className="hidden flex-col gap-8 md:flex">
        <Separator label="또는" />
        <ButtonLink href="/login" variant="outline" size="xl">
          로그인 페이지로 이동
        </ButtonLink>
      </div>
    </div>
  );
}

export default Page;
