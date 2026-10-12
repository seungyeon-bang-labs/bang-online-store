'use client';

import { useState } from 'react';
import { SignupForm } from '@/features/auth/signup-form';
import { SignupOtpForm } from '@/features/auth/signup-otp-form';
import type { SignupTermViewModel } from '@/domains/terms/view-model';

interface SignupFlowProps {
  termsViewModel: SignupTermViewModel[];
}

export function SignupFlow({ termsViewModel }: SignupFlowProps) {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [signupEmail, setSignupEmail] = useState('');

  const handleSignupSuccess = (email: string) => {
    setSignupEmail(email);
    setStep('otp');
  };

  return step === 'details' ? (
    <SignupForm
      termsViewModel={termsViewModel}
      onSuccess={handleSignupSuccess}
    />
  ) : (
    <SignupOtpForm
      email={signupEmail}
      initialCodeRequested
    />
  );
}
