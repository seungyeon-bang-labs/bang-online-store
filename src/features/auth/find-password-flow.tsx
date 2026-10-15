'use client';

import { useState } from 'react';
import type {
  PasswordRecoveryRequestResult,
  PasswordRecoveryVerificationResult,
  PasswordResetResult,
} from '@/domains/auth/schema';
import { FindPasswordForm } from './find-password-form';
import { PasswordResetOtpForm } from './password-reset-otp-form';
import { ResetPasswordForm } from './reset-password-form';
import { AuthSecondaryLink } from './auth-secondary-link';
import { ButtonLink } from '@/shared/components/ui/button';
import { Separator } from '@/shared/components/ui/separator';

type TerminalResult = Exclude<
  PasswordResetResult,
  { status: 'error' | 'restart' }
>;
type FlowState =
  | { step: 'email'; message?: string }
  | { step: 'otp'; email: string; otpExpiresAt: number }
  | { step: 'password' }
  | { step: 'complete'; result: TerminalResult };

interface FindPasswordFlowProps {
  requestAction: (input: unknown) => Promise<PasswordRecoveryRequestResult>;
  verifyAction: (input: unknown) => Promise<PasswordRecoveryVerificationResult>;
  resetAction: (input: unknown) => Promise<PasswordResetResult>;
}

export function FindPasswordFlow({
  requestAction,
  verifyAction,
  resetAction,
}: FindPasswordFlowProps) {
  const [state, setState] = useState<FlowState>({ step: 'email' });

  if (state.step === 'complete') {
    const { result } = state;
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">
            {result.status === 'unknown'
              ? '비밀번호 변경 결과 확인'
              : '비밀번호 변경 완료'}
          </h2>
          <p
            role={result.status === 'success' ? 'status' : 'alert'}
            className="text-sm leading-5"
          >
            {result.status === 'success'
              ? '비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인해주세요.'
              : result.message}
          </p>
        </div>
        <ButtonLink href="/login" size="xl">
            로그인으로 이동
          </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {state.step === 'email' && (
        <div className="flex flex-col gap-3">
          {state.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
          <FindPasswordForm
            requestAction={requestAction}
            onSent={(email, otpExpiresAt) =>
              setState({ step: 'otp', email, otpExpiresAt })
            }
          />
          <AuthSecondaryLink variant="password" />
        </div>
      )}
      {state.step === 'otp' && (
        <PasswordResetOtpForm
          email={state.email}
          otpExpiresAt={state.otpExpiresAt}
          requestAction={requestAction}
          verifyAction={verifyAction}
          onResult={result =>
            setState(
              result.status === 'verified'
                ? { step: 'password' }
                : { step: 'email', message: result.message },
            )
          }
        />
      )}
      {state.step === 'password' && (
        <ResetPasswordForm
          resetAction={resetAction}
          onResult={result =>
            setState(
              result.status === 'restart'
                ? { step: 'email', message: result.message }
                : { step: 'complete', result },
            )
          }
        />
      )}
      <div className="hidden flex-col gap-8 md:flex">
        <Separator label="또는" />
        <ButtonLink href="/login" variant="outline" size="xl">
          로그인 페이지로 이동
        </ButtonLink>
      </div>
    </div>
  );
}
