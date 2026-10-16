'use client';

import { useState } from 'react';
import { SignupForm } from '@/features/auth/signup-form';
import { SignupOtpForm } from '@/features/auth/signup-otp-form';
import type { SignupTermViewModel } from '@/domains/terms/view-model';
import type { AuthFeatureRestriction } from '@/domains/auth/schema';

interface SignupFlowProps {
  termsViewModel: SignupTermViewModel[];
  restriction?: AuthFeatureRestriction | null;
}

export function SignupFlow({ termsViewModel, restriction }: SignupFlowProps) {
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [signupEmail, setSignupEmail] = useState('');

  const handleSignupSuccess = (email: string) => {
    setSignupEmail(email);
    setStep('otp');
  };

  return step === 'details' ? (
    <SignupForm
      restriction={restriction}
      termsViewModel={termsViewModel}
      onSuccess={handleSignupSuccess}
    />
  ) : (
    <SignupOtpForm
      restriction={restriction}
      email={signupEmail}
      initialCodeRequested
    />
  );
}
