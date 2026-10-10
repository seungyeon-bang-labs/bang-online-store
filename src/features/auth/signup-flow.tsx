'use client';

import { useState } from 'react';
import { SignupForm } from '@/features/auth/signup-form';
import { SignupOtpForm } from '@/features/auth/signup-otp-form';
import { SIGNUP_OTP_DURATION_SECONDS } from '@/domains/auth/schema';
import type { SignupTermViewModel } from '@/domains/terms/view-model';

interface SignupFlowProps {
  termsViewModel: SignupTermViewModel[];
}

export function SignupFlow({ termsViewModel }: SignupFlowProps) {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [signupEmail, setSignupEmail] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null);

  const handleSignupSuccess = (email: string) => {
    setSignupEmail(email);
    setOtpExpiresAt(Date.now() + SIGNUP_OTP_DURATION_SECONDS * 1000);
    setStep('otp');
  };

  const handleResendSuccess = () => {
    setOtpExpiresAt(Date.now() + SIGNUP_OTP_DURATION_SECONDS * 1000);
  };

  const handleBack = () => {
    setStep('details');
  };

  return step === 'details' || otpExpiresAt === null ? (
    <SignupForm
      termsViewModel={termsViewModel}
      defaultEmail={signupEmail}
      onSuccess={handleSignupSuccess}
    />
  ) : (
    <SignupOtpForm
      email={signupEmail}
      expiresAt={otpExpiresAt}
      onResendSuccess={handleResendSuccess}
      onBack={handleBack}
    />
  );
}
