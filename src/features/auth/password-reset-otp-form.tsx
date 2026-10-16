'use client';

import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Mail } from 'lucide-react';
import {
  passwordRecoveryOtpFormSchema,
  PASSWORD_RECOVERY_OTP_LENGTH,
  type PasswordRecoveryOtpFormValues,
  type PasswordRecoveryRequestResult,
  type PasswordRecoveryVerificationResult,
  type AuthFeatureRestriction,
} from '@/domains/auth/schema';
import { IconInput } from '@/shared/components/common/icon-input';
import { Button, FormSubmitButton } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/shared/components/ui/input-otp';
import { formatMinutesSeconds } from '@/shared/lib/format';

interface PasswordResetOtpFormProps {
  restriction?: AuthFeatureRestriction | null;
  email: string;
  otpExpiresAt: number;
  requestAction: (input: unknown) => Promise<PasswordRecoveryRequestResult>;
  verifyAction: (input: unknown) => Promise<PasswordRecoveryVerificationResult>;
  onResult: (
    result: Exclude<PasswordRecoveryVerificationResult, { status: 'error' }>,
  ) => void;
}

export function PasswordResetOtpForm({
  restriction,
  email,
  otpExpiresAt,
  requestAction,
  verifyAction,
  onResult,
}: PasswordResetOtpFormProps) {
  const [serverRestriction, setServerRestriction] =
    useState<AuthFeatureRestriction | null>(null);
  const activeRestriction = restriction ?? serverRestriction;
  const [expiresAt, setExpiresAt] = useState(otpExpiresAt);
  const [now, setNow] = useState(() => Date.now());
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const {
    control,
    handleSubmit,
    setError,
    clearErrors,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<PasswordRecoveryOtpFormValues>({
    resolver: zodResolver(passwordRecoveryOtpFormSchema),
    defaultValues: { token: '' },
  });
  const remainingSeconds = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const isExpired = remainingSeconds === 0;
  const isBusy = isSubmitting || isResending;
  const remainingTime = formatMinutesSeconds(remainingSeconds);

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
    if (activeRestriction || isResending) return;
    if (Date.now() >= expiresAt) {
      setNow(Date.now());
      return;
    }
    setResendMessage('');
    try {
      const result = await verifyAction({ email, token: values.token });
      if (result.status === 'error') {
        if (result.reason === 'feature_disabled') {
          setServerRestriction({ reason: result.reason, message: result.message });
        } else setError('token', { message: result.message });
      } else onResult(result);
    } catch {
      setError('root', {
        message:
          '인증 결과를 확인하지 못했습니다. 다시 확인하거나 새 인증번호를 받아주세요.',
      });
    }
  });

  const handleResend = async () => {
    if (activeRestriction || isBusy || Date.now() < expiresAt) return;
    setIsResending(true);
    setResendMessage('');
    clearErrors('root');
    try {
      const result = await requestAction({ email });
      if (result.status === 'sent') {
        setExpiresAt(result.otpExpiresAt);
        setNow(Date.now());
        resetField('token');
        clearErrors();
        setResendMessage(
          '입력하신 이메일 주소로 인증번호를 전송했습니다. 이메일을 확인해주세요.',
        );
      } else if (result.reason === 'feature_disabled') {
        setServerRestriction({ reason: result.reason, message: result.message });
      } else setError('root', { message: result.message });
    } catch {
      setError('root', {
        message:
          '발송 결과를 확인하지 못했습니다. 이메일을 확인하거나 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">이메일 인증</h2>
      {activeRestriction ? (
        <div
          id="recovery-otp-help"
          role="status"
          className="rounded-md border bg-muted px-4 py-3 text-sm leading-6 text-foreground"
        >
          <p className="font-semibold">데모 안내</p>
          <p>{activeRestriction.message}</p>
        </div>
      ) : (
        <p id="recovery-otp-help" className="text-sm leading-5 text-zinc-600">
          입력하신 이메일 주소로 인증번호를 전송했습니다. 비밀번호를 재설정하려면
          이메일로 받은 인증번호 6자리를 입력해주세요.
        </p>
      )}
      <IconInput
        type="email"
        icon={Mail}
        placeholder="이메일"
        value={email}
        readOnly
        aria-label="인증할 이메일"
        rightAddon={
          <span
            role="timer"
            aria-label={'인증번호 남은 유효시간 ' + remainingTime}
            className="w-12 whitespace-nowrap text-right text-base font-medium tabular-nums"
          >
            {remainingTime}
          </span>
        }
      />
      <div className="space-y-2">
        <Controller
          name="token"
          control={control}
          render={({ field }) => (
            <InputOTP
              {...field}
              maxLength={PASSWORD_RECOVERY_OTP_LENGTH}
              pattern={REGEXP_ONLY_DIGITS}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="인증번호"
              disabled={isBusy || isExpired}
              aria-invalid={!!errors.token}
              aria-describedby={
                activeRestriction
                  ? 'recovery-otp-help'
                  : isExpired
                    ? 'recovery-otp-help recovery-otp-expired'
                    : errors.token
                      ? 'recovery-otp-help recovery-otp-error'
                      : 'recovery-otp-help'
              }
              containerClassName="min-w-0 flex-1 gap-0"
            >
              <InputOTPGroup className="grid w-full grid-cols-6">
                {Array.from(
                  { length: PASSWORD_RECOVERY_OTP_LENGTH },
                  (_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-full text-base"
                      aria-invalid={!!errors.token}
                    />
                  ),
                )}
              </InputOTPGroup>
            </InputOTP>
          )}
        />
        {isExpired && !activeRestriction ? (
          <p
            id="recovery-otp-expired"
            role="alert"
            className="text-sm text-destructive"
          >
            인증번호가 만료되었습니다. 재전송해주세요.
          </p>
        ) : (
          <InputError
            id="recovery-otp-error"
            message={activeRestriction ? undefined : errors.token?.message}
          />
        )}
      </div>
      <InputError message={activeRestriction ? undefined : errors.root?.message} />
      {resendMessage && !activeRestriction && (
        <p role="status" className="text-sm">
          {resendMessage}
        </p>
      )}
      <FormSubmitButton
        isPending={isSubmitting}
        disabled={!!activeRestriction || isBusy || isExpired}
      >
        인증 확인
      </FormSubmitButton>
      <Button
        type="button"
        variant={isResending ? 'default' : 'outline'}
        size="xl"
        onClick={handleResend}
        disabled={!!activeRestriction || isBusy || !isExpired}
      >
        {isResending ? '발송 중…' : '인증번호 재전송'}
      </Button>
    </form>
  );
}
