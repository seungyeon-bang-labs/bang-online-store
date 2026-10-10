'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Mail } from 'lucide-react';
import type { z } from 'zod';

import {
  verifySignupOtpAction,
  resendSignupOtpAction,
} from '@/app/(auth)/actions';
import { SIGNUP_OTP_LENGTH, signupOtpSchema } from '@/domains/auth/schema';
import { IconInput } from '@/shared/components/common/icon-input';
import { Button, FormSubmitButton } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/ui/input-otp';

interface SignupOtpFormProps {
  email: string;
  expiresAt: number;
  onResendSuccess: () => void;
  onBack: () => void;
}

const otpFormSchema = signupOtpSchema.pick({ token: true });

type SignupOtpFormValues = z.infer<typeof otpFormSchema>;

export function SignupOtpForm({
  email,
  expiresAt,
  onResendSuccess,
  onBack,
}: SignupOtpFormProps) {
  const router = useRouter();

  const [isResending, setIsResending] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [resendMessage, setResendMessage] = useState('');

  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<SignupOtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { token: '' },
  });

  const isBusy = isSubmitting || isResending || isCompleting;
  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const isExpired = remainingSeconds === 0;
  const remainingTime = `${Math.floor(remainingSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    const timer = window.setInterval(updateNow, 1000);
    window.addEventListener('focus', updateNow);
    document.addEventListener('visibilitychange', updateNow);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', updateNow);
      document.removeEventListener('visibilitychange', updateNow);
    };
  }, []);

  const onSubmit = handleSubmit(async values => {
    if (isResending || isCompleting) return;

    const submittedAt = Date.now();
    if (submittedAt >= expiresAt) {
      setNow(submittedAt);
      return;
    }

    clearErrors();
    setResendMessage('');

    try {
      const result = await verifySignupOtpAction({
        email,
        token: values.token,
      });

      if (result.stage === 'complete') {
        // 이메일 인증은 성공했습니다.
        // 인증번호 재입력을 막고 가입 완료 화면으로 이동합니다.
        setIsCompleting(true);
        router.replace('/signup/complete');
        return;
      }

      setError(
        'token',
        { type: 'server', message: result.message },
        { shouldFocus: true },
      );
    } catch {
      setError('root', {
        message: '인증 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
      });
    }

    // 전체 성공 시 서버 액션의 redirect('/')가 이동을 처리합니다.
  });

  const handleResend = async () => {
    if (isBusy || Date.now() < expiresAt) return;

    clearErrors('root');
    setResendMessage('');
    setIsResending(true);

    try {
      const result = await resendSignupOtpAction({ email });

      if (!result.ok) {
        setError('root', { message: result.message });
        return;
      }

      resetField('token');
      clearErrors();
      setResendMessage(result.message);
      onResendSuccess();
      setNow(Date.now());
    } catch {
      setError('root', {
        message:
          '재전송 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">이메일 인증</h2>
        <p id="signup-otp-help" className="text-muted-foreground text-sm">
          가입을 완료하려면 이메일로 받은 인증번호 {SIGNUP_OTP_LENGTH}자리를
          입력해주세요.
        </p>
      </div>

      <div className="space-y-2">
        <IconInput
          id="signup-otp-email"
          type="email"
          icon={Mail}
          placeholder="이메일"
          aria-label="인증번호를 보낸 이메일"
          value={email}
          readOnly
          rightAddon={
            <span
              role="timer"
              aria-label={`인증번호 남은 유효시간 ${remainingTime}`}
              className="w-12 whitespace-nowrap text-right text-base font-medium tabular-nums"
            >
              {remainingTime}
            </span>
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Controller
            name="token"
            control={control}
            render={({ field }) => (
              <InputOTP
                {...field}
                id="signup-otp"
                maxLength={SIGNUP_OTP_LENGTH}
                pattern={REGEXP_ONLY_DIGITS}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label="인증번호"
                disabled={isBusy}
                containerClassName="min-w-0 flex-1 gap-0"
                aria-invalid={!!errors.token}
                aria-describedby={
                  isExpired
                    ? 'signup-otp-help signup-otp-expired'
                    : errors.token
                      ? 'signup-otp-help signup-otp-error'
                      : 'signup-otp-help'
                }
              >
                <InputOTPGroup className="grid w-full grid-cols-6">
                  {Array.from({ length: SIGNUP_OTP_LENGTH }, (_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-full text-base"
                      aria-invalid={!!errors.token}
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            )}
          />
        </div>

        <InputError
          id="signup-otp-error"
          message={isExpired ? undefined : errors.token?.message}
        />
        {isExpired && (
          <p
            id="signup-otp-expired"
            role="alert"
            className="text-destructive text-sm"
          >
            인증번호가 만료되었습니다. 재전송해주세요.
          </p>
        )}
      </div>

      <InputError message={errors.root?.message} />

      {resendMessage && (
        <p role="status" className="text-sm">
          {resendMessage}
        </p>
      )}

      <FormSubmitButton
        isPending={isSubmitting || isCompleting}
        disabled={isBusy || isExpired}
      >
        인증 확인
      </FormSubmitButton>

      <Button
        type="button"
        variant="outline"
        size="xl"
        onClick={handleResend}
        disabled={isBusy || !isExpired}
      >
        {isResending ? '재전송 중…' : '인증번호 재전송'}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="xl"
        onClick={onBack}
        disabled={isBusy}
      >
        이메일 수정
      </Button>
    </form>
  );
}
