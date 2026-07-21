'use client';

import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useEffect, useMemo, useState } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type PathValue,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';

type EmailVerificationProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  emailName?: Path<TFieldValues>;
  verifiedName?: Path<TFieldValues>;
  ariaInvalid?: boolean;
  disabled?: boolean;
};

const OTP_LENGTH = 6;
const COUNTDOWN_DURATION = 180;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function EmailVerification<TFieldValues extends FieldValues>({
  control,
  setValue,
  emailName,
  verifiedName,
  ariaInvalid,
  disabled,
}: EmailVerificationProps<TFieldValues>) {
  const [otp, setOtp] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const emailField = useMemo(
    () => emailName ?? ('email' as Path<TFieldValues>),
    [emailName],
  );

  const verifiedField = useMemo(
    () => verifiedName ?? ('isEmailVerified' as Path<TFieldValues>),
    [verifiedName],
  );

  const emailValue = useWatch({ control, name: emailField });
  const isVerified = useWatch({ control, name: verifiedField });
  const resolvedIsVerified = Boolean(isVerified);
  const emailText = typeof emailValue === 'string' ? emailValue : '';
  const isEmailValid = EMAIL_REGEX.test(emailText);

  const isCountdownActive = countdown > 0;
  const canRequestCode = !isRequesting && (!isCodeSent || !isCountdownActive);
  const canVerify = otp.length === OTP_LENGTH && !isVerifying;

  const setVerified = (value: boolean) => {
    setValue(
      verifiedField,
      value as PathValue<TFieldValues, Path<TFieldValues>>,
      {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      },
    );
  };

  const resetVerificationState = () => {
    if (resolvedIsVerified) {
      setVerified(false);
    }
    if (isCodeSent || otp) {
      setIsCodeSent(false);
      setOtp('');
      setCountdown(0);
    }
  };

  useEffect(() => {
    if (!isCountdownActive) return;
    const timer = window.setTimeout(() => {
      setCountdown(prev => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [countdown, isCountdownActive]);

  const handleRequestCode = async () => {
    if (disabled || !isEmailValid || !canRequestCode) return;

    setIsRequesting(true);
    try {
      const response = await fetch('/api/email-verification/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailText }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        code?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || '인증 코드 전송 실패');
      }

      setIsCodeSent(true);
      setCountdown(COUNTDOWN_DURATION);

      if (data.code) {
        window.alert(`인증 코드가 발송되었습니다.\n인증 코드: ${data.code}`);
      }
    } catch (error) {
      console.error('인증 코드 전송 실패:', error);
      window.alert('인증 코드 전송에 실패했습니다.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerify = async () => {
    if (!canVerify) return;

    setIsVerifying(true);
    try {
      const response = await fetch('/api/email-verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailText, code: otp }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || '인증 실패');
      }

      setVerified(true);
      setIsCodeSent(false);
      setOtp('');
      setCountdown(0);
    } catch (error) {
      console.error('인증 실패:', error);
      window.alert('인증 코드가 올바르지 않거나 만료되었습니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const requestLabel = isRequesting
    ? '요청 중'
    : isCodeSent
      ? `재요청${isCountdownActive ? ` (${formatTime(countdown)})` : ''}`
      : '인증 요청';

  return (
    <div className="flex flex-col gap-3 w-full">
      <InputGroup>
        <Controller
          control={control}
          name={emailField}
          render={({ field }) => (
            <InputGroupInput
              placeholder="이메일"
              type="email"
              disabled={disabled || isRequesting || isCountdownActive}
              value={field.value ?? ''}
              onChange={event => {
                field.onChange(event);
                resetVerificationState();
              }}
              onBlur={() => {
                if (isRequesting || isVerifying) return;
                field.onBlur();
                if (!resolvedIsVerified && isEmailValid) {
                  setValue(
                    verifiedField,
                    false as PathValue<TFieldValues, Path<TFieldValues>>,
                    {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    },
                  );
                }
              }}
              aria-invalid={ariaInvalid}
            />
          )}
        />
        <InputGroupAddon>
          <Mail className="size-5" />
        </InputGroupAddon>
        {!resolvedIsVerified && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              variant="outline"
              size="sm"
              onMouseDown={event => event.preventDefault()}
              onClick={handleRequestCode}
              disabled={disabled || !canRequestCode || !isEmailValid}
              aria-invalid={ariaInvalid}
            >
              {isRequesting && <Loader2 className="size-4 animate-spin" />}
              {requestLabel}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      {resolvedIsVerified ? (
        <VerifiedMessage />
      ) : (
        isCodeSent && (
          <OTPInput
            value={otp}
            onChange={setOtp}
            onVerify={handleVerify}
            isVerifying={isVerifying}
            canVerify={canVerify}
            disabled={disabled}
            ariaInvalid={ariaInvalid}
          />
        )
      )}
    </div>
  );
}

function VerifiedMessage() {
  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
      <CheckCircle2 className="size-5 text-green-600" />
      <span className="text-sm text-green-700 font-medium">
        이메일이 인증되었습니다.
      </span>
    </div>
  );
}

type OTPInputProps = {
  value: string;
  onChange: (value: string) => void;
  onVerify: () => void;
  isVerifying: boolean;
  canVerify: boolean;
  disabled?: boolean;
  ariaInvalid?: boolean;
};

function OTPInput({
  value,
  onChange,
  onVerify,
  isVerifying,
  canVerify,
  disabled,
  ariaInvalid,
}: OTPInputProps) {
  return (
    <div className="flex items-center gap-2 w-full">
      <InputOTP
        maxLength={OTP_LENGTH}
        value={value}
        onChange={onChange}
        containerClassName="flex-1 w-full"
        disabled={disabled || isVerifying}
      >
        <InputOTPGroup className="w-full gap-0">
          {Array.from({ length: OTP_LENGTH }, (_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="flex-1"
              aria-invalid={ariaInvalid}
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
      <Button
        variant="outline"
        size="xl"
        type="button"
        onMouseDown={event => event.preventDefault()}
        onClick={onVerify}
        disabled={disabled || !canVerify}
        aria-invalid={ariaInvalid}
      >
        {isVerifying ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            확인 중
          </>
        ) : (
          '확인'
        )}
      </Button>
    </div>
  );
}
