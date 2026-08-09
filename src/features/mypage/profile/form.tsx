'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  };
  const [formValues, setFormValues] = useState(initialFormValues);
  const isDirty =
    formValues.name !== initialFormValues.name ||
    formValues.phoneNumber !== initialFormValues.phoneNumber ||
    formValues.birthDate !== initialFormValues.birthDate;

  const handleFieldChange = (field: EditableProfileField, value: string) => {
    setFormValues(currentValues => ({ ...currentValues, [field]: value }));
  };

  const handleCancelChanges = () => {
    setFormValues(initialFormValues);
  };

  return (
    <form onSubmit={event => event.preventDefault()} className="space-y-4">
      <AccountInformation profile={profile} />
      <BasicInformation
        values={formValues}
        onFieldChange={handleFieldChange}
        actions={
          <div className="flex justify-end px-5 pt-3 pb-5 md:px-6">
            <div className="flex w-full gap-2 md:w-auto">
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={!isDirty}
                onClick={handleCancelChanges}
                className="flex-1 border-zinc-300 bg-white font-bold shadow-none hover:border-black hover:bg-white hover:text-black md:w-30 md:flex-none"
              >
                변경 취소
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={!isDirty}
                className="flex-1 bg-black font-bold text-white hover:bg-zinc-800 md:w-30 md:flex-none"
              >
                저장
              </Button>
            </div>
          </div>
        }
      />
    </form>
  );
}
