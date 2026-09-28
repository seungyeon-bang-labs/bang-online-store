'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { MemberProfileViewModel } from '@/domains/member';
import { AccountInformation } from './account-information';
import { BasicInformation } from './basic-information';
import type {
  EditableProfileField,
  EditableProfileFormValues,
} from './types';

interface MypageProfileFormProps {
  profile: MemberProfileViewModel;
}

export function MypageProfileForm({ profile }: MypageProfileFormProps) {
  const initialFormValues: EditableProfileFormValues = {
    name: profile.name,
    phoneNumber: profile.phoneNumber,
    birthDate: profile.birthDate,
    gender: profile.gender,
  };
  const [formValues, setFormValues] = useState(initialFormValues);
  const [isPhoneNumberVerified, setIsPhoneNumberVerified] = useState(true);
  const [hasRequestedPhoneVerification, setHasRequestedPhoneVerification] =
    useState(false);
  const isDirty =
    formValues.name !== initialFormValues.name ||
    formValues.phoneNumber !== initialFormValues.phoneNumber ||
    formValues.birthDate !== initialFormValues.birthDate ||
    formValues.gender !== initialFormValues.gender;

  const handleFieldChange = (field: EditableProfileField, value: string) => {
    setFormValues(currentValues => ({ ...currentValues, [field]: value }));

    if (field === 'phoneNumber') {
      setIsPhoneNumberVerified(value === initialFormValues.phoneNumber);
      setHasRequestedPhoneVerification(false);
    }
  };

  const handlePhoneVerification = () => {
    setIsPhoneNumberVerified(true);
    setHasRequestedPhoneVerification(true);
    toast.success('휴대폰 인증을 완료했습니다.', { position: 'bottom-center' });
  };

  const handleCancelChanges = () => {
    setFormValues(initialFormValues);
    setIsPhoneNumberVerified(true);
    setHasRequestedPhoneVerification(false);
  };

  return (
    <form onSubmit={event => event.preventDefault()} className="space-y-4">
      <AccountInformation profile={profile} />
      <BasicInformation
        values={formValues}
        isDirty={isDirty}
        isPhoneNumberVerified={isPhoneNumberVerified}
        hasRequestedPhoneVerification={hasRequestedPhoneVerification}
        onFieldChange={handleFieldChange}
        onPhoneVerification={handlePhoneVerification}
        onReset={handleCancelChanges}
      />
    </form>
  );
}
