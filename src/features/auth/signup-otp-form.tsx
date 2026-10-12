'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Mail } from 'lucide-react';
import {
  verifySignupOtpAction,
  resendSignupOtpAction,
  retrySignupMemberAction,
  type SignupMemberFailure,
} from '@/app/(auth)/actions';
import {
  SIGNUP_OTP_LENGTH,
  SIGNUP_OTP_DURATION_SECONDS,
  signupOtpFormSchema,
  type SignupOtpFormValues,
} from '@/domains/auth/schema';
import { IconInput } from '@/shared/components/common/icon-input';
import { formatMinutesSeconds } from '@/shared/lib/format';
import { Button, FormSubmitButton } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/ui/input-otp';

interface SignupOtpFormProps {
  email: string;
  initialCodeRequested?: boolean;
  initialMemberFailure?: SignupMemberFailure;
}

export function SignupOtpForm({
  email,
  initialCodeRequested = false,
  initialMemberFailure,
}: SignupOtpFormProps) {
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [isCheckingMember, setIsCheckingMember] = useState(false);
  const [memberFailure, setMemberFailure] = useState(
    initialMemberFailure ?? null,
  );
  const [expiresAt, setExpiresAt] = useState<number | null>(() =>
    initialCodeRequested
      ? Date.now() + SIGNUP_OTP_DURATION_SECONDS * 1000
      : null,
  );
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
    resolver: zodResolver(signupOtpFormSchema),
    defaultValues: { token: '' },
  });
  const isBusy = isSubmitting || isResending || isCheckingMember;
  const hasCode = expiresAt !== null;
  const remainingSeconds =
    expiresAt === null ? 0 : Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const isExpired = hasCode && remainingSeconds === 0;
  const remainingTime = formatMinutesSeconds(remainingSeconds);

  let otpDescriptionIds = 'signup-otp-help';

  if (isExpired) {
    otpDescriptionIds += ' signup-otp-expired';
  } else if (errors.token) {
    otpDescriptionIds += ' signup-otp-error';
  }

  useEffect(() => {
    if (expiresAt === null || memberFailure) return;
    const updateNow = () => setNow(Date.now());
    const timer = window.setInterval(updateNow, 1000);
    window.addEventListener('focus', updateNow);
    document.addEventListener('visibilitychange', updateNow);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', updateNow);
      document.removeEventListener('visibilitychange', updateNow);
    };
  }, [expiresAt, memberFailure]);

  const onSubmit = handleSubmit(async values => {
    if (
      isResending ||
      isCheckingMember ||
      memberFailure ||
      expiresAt === null
    ) {
      return;
    }
    const submittedAt = Date.now();

    if (submittedAt >= expiresAt) {
      setNow(submittedAt);
      return;
    }
    setResendMessage('');
    try {
      const result = await verifySignupOtpAction({
        email,
        token: values.token,
      });

      if (result.ok) {
        router.replace('/');
      } else if (result.stage === 'member') {
        setMemberFailure(result);
      } else {
        setError(
          'token',
          { type: 'server', message: result.message },
          { shouldFocus: true },
        );
      }
    } catch {
      setMemberFailure({
        ok: false,
        stage: 'member',
        retryable: true,
        message:
          '인증 결과를 확인하지 못했습니다. 회원 상태를 다시 확인해주세요.',
      });
    }
  });

  const handleMemberRetry = async () => {
    if (isBusy || !memberFailure?.retryable) return;
    setIsCheckingMember(true);
    try {
      const result = await retrySignupMemberAction();

      if (result.ok) {
        router.replace('/');
      } else {
        setMemberFailure(result);
      }
    } catch {
      setMemberFailure({
        ok: false,
        stage: 'member',
        retryable: true,
        message: '회원 정보를 확인하지 못했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsCheckingMember(false);
    }
  };

  const handleResend = async () => {
    if (
      isBusy ||
      memberFailure ||
      (expiresAt !== null && Date.now() < expiresAt)
    ) {
      return;
    }
    clearErrors('root');
    setResendMessage('');
    setIsResending(true);
    try {
      const result = await resendSignupOtpAction({ email });
      if (!result.ok) {
        setError('root', { message: result.message });
        return;
      }
      const sentAt = Date.now();

      resetField('token');
      clearErrors();
      setResendMessage(result.message);
      setExpiresAt(sentAt + SIGNUP_OTP_DURATION_SECONDS * 1000);
      setNow(sentAt);
    } catch {
      setError('root', {
        message: '발송 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (memberFailure) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="text-lg font-semibold">회원 상태 확인</h2>
        <p role="alert" className="text-sm text-destructive">
          {memberFailure.message}
        </p>
        {memberFailure.retryable && (
          <Button
            type="button"
            size="xl"
            onClick={handleMemberRetry}
            disabled={isBusy}
          >
            {isCheckingMember ? '확인 중…' : '회원 상태 다시 확인'}
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">이메일 인증</h2>
        <p id="signup-otp-help" className="text-muted-foreground text-sm">
          {hasCode
            ? `이메일로 받은 인증번호 ${SIGNUP_OTP_LENGTH}자리를 입력해주세요.`
            : '아직 이메일 인증이 완료되지 않았습니다. 로그인을 계속하려면 아래 이메일로 인증번호를 받아 인증을 완료해주세요.'}
        </p>
      </div>
      <IconInput
        id="signup-otp-email"
        type="email"
        icon={Mail}
        placeholder="이메일"
        aria-label="인증할 이메일"
        value={email}
        readOnly
        rightAddon={
          hasCode ? (
            <span
              role="timer"
              aria-label={`인증번호 남은 유효시간 ${remainingTime}`}
              className="w-12 whitespace-nowrap text-right text-base font-medium tabular-nums"
            >
              {remainingTime}
            </span>
          ) : undefined
        }
      />
      {hasCode && (
        <div className="space-y-2">
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
                disabled={isBusy || isExpired}
                containerClassName="min-w-0 flex-1 gap-0"
                aria-invalid={!!errors.token}
                aria-describedby={otpDescriptionIds}
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
      )}
      <InputError message={errors.root?.message} />
      {resendMessage && (
        <p role="status" className="text-sm">
          {resendMessage}
        </p>
      )}
      {hasCode && (
        <FormSubmitButton
          isPending={isSubmitting}
          disabled={isBusy || isExpired}
        >
          인증 확인
        </FormSubmitButton>
      )}
      <Button
        type="button"
        variant={isResending || !hasCode ? 'default' : 'outline'}
        size="xl"
        onClick={handleResend}
        disabled={isBusy || (hasCode && !isExpired)}
      >
        {isResending
          ? '발송 중…'
          : hasCode
            ? '인증번호 재전송'
            : '인증번호 받기'}
      </Button>
    </form>
  );
}
