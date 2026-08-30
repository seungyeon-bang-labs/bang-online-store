'use client';

import { useCallback, useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input, InputError } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  formatKoreanPhoneNumber,
  validateUserAddressFormInput,
  type UserAddressFormViewModel,
} from '@/domains/member';
import { MypageAddressSearchField } from './address-search-field';
import { MypageAddressSubmissionResult } from './submission-result';
import type { MypageAddressFormMode, MypageAddressFormValues } from './types';

interface AddressFormErrors {
  recipientName?: string;
  phoneNumber?: string;
  address?: string;
}

interface MypageAddressFormProps {
  mode: MypageAddressFormMode;
  returnHref: string;
  initialAddress?: UserAddressFormViewModel;
}

const inputClassName =
  'border-zinc-300 bg-white font-medium shadow-none hover:ring-[3px] hover:ring-black/70 focus-visible:border-zinc-300 focus-visible:ring-black/70';
const fieldLabelClassName = 'text-sm font-black text-black md:pt-2';
const fieldRowClassName =
  'grid gap-3 md:grid-cols-[120px_minmax(0,1fr)] md:items-start';

function getInitialFormValues(
  initialAddress?: UserAddressFormViewModel,
): MypageAddressFormValues {
  return {
    recipientName: initialAddress?.recipientName ?? '',
    phoneNumber: initialAddress?.phoneNumber ?? '',
    postalCode: initialAddress?.postalCode ?? '',
    addressLine1: initialAddress?.addressLine1 ?? '',
    addressLine2: initialAddress?.addressLine2 ?? '',
    deliveryNote: initialAddress?.deliveryNote ?? '',
    isDefault: initialAddress?.isDefault ?? false,
  };
}

export function MypageAddressForm({
  mode,
  returnHref,
  initialAddress,
}: MypageAddressFormProps) {
  const [values, setValues] = useState(() => getInitialFormValues(initialAddress));
  const [errors, setErrors] = useState<AddressFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isEditMode = mode === 'edit';

  function updateValue<Key extends keyof MypageAddressFormValues>(
    key: Key,
    value: MypageAddressFormValues[Key],
  ) {
    setValues(currentValues => ({ ...currentValues, [key]: value }));
  }

  function submitAddress() {
    const validation = validateUserAddressFormInput(values);
    const nextErrors: AddressFormErrors = {
      ...(validation.isRecipientNameValid
        ? {}
        : { recipientName: '수령인을 입력해 주세요.' }),
      ...(validation.isPhoneNumberValid
        ? {}
        : { phoneNumber: '올바른 국내 연락처를 입력해 주세요.' }),
      ...(validation.isPostalCodeValid && validation.isAddressLine1Valid
        ? {}
        : { address: '주소를 검색해 선택해 주세요.' }),
    };

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitted(true);
  }

  const handleAddressSearchUnavailable = useCallback(() => {
    setErrors(currentErrors => ({
      ...currentErrors,
      address: '주소 검색을 불러오지 못했습니다. 다시 시도해 주세요.',
    }));
  }, []);

  if (isSubmitted) {
    return (
      <MypageAddressSubmissionResult
        mode={mode}
        returnHref={returnHref}
      />
    );
  }

  return (
    <form
      noValidate
      onSubmit={event => {
        event.preventDefault();
        submitAddress();
      }}
      className="overflow-hidden rounded-md border border-zinc-300 bg-white"
    >
      <header className="px-5 py-4 md:px-6">
        <h2 className="text-base font-black text-black">
          {isEditMode ? '배송지 수정' : '배송지 추가'}
        </h2>
      </header>

      <div className="space-y-5 border-t border-zinc-300 p-5 md:p-6">
        <div className={fieldRowClassName}>
          <label htmlFor="recipient-name" className={fieldLabelClassName}>
            수령인{' '}
            <span className="ml-1 text-sm font-medium text-zinc-500">
              (필수)
            </span>
          </label>
          <div>
            <Input
              id="recipient-name"
              autoComplete="name"
              value={values.recipientName}
              onChange={event => {
                updateValue('recipientName', event.target.value);
                setErrors(currentErrors => ({
                  ...currentErrors,
                  recipientName: undefined,
                }));
              }}
              placeholder="수령인을 입력해 주세요"
              aria-invalid={Boolean(errors.recipientName)}
              className={inputClassName}
            />
            <InputError message={errors.recipientName} />
          </div>
        </div>

        <div className={fieldRowClassName}>
          <label htmlFor="phone-number" className={fieldLabelClassName}>
            연락처{' '}
            <span className="ml-1 text-sm font-medium text-zinc-500">
              (필수)
            </span>
          </label>
          <div>
            <Input
              id="phone-number"
              inputMode="tel"
              autoComplete="tel"
              value={values.phoneNumber}
              onChange={event => {
                updateValue(
                  'phoneNumber',
                  formatKoreanPhoneNumber(event.target.value),
                );
                setErrors(currentErrors => ({
                  ...currentErrors,
                  phoneNumber: undefined,
                }));
              }}
              placeholder="숫자만 입력해 주세요"
              aria-invalid={Boolean(errors.phoneNumber)}
              className={inputClassName}
            />
            <InputError message={errors.phoneNumber} />
          </div>
        </div>

        <div className={fieldRowClassName}>
          <p id="address-label" className={fieldLabelClassName}>
            주소{' '}
            <span className="ml-1 text-sm font-medium text-zinc-500">
              (필수)
            </span>
          </p>
          <MypageAddressSearchField
            postalCode={values.postalCode}
            addressLine1={values.addressLine1}
            addressLine2={values.addressLine2}
            error={errors.address}
            onAddressSelect={({ postalCode, addressLine1 }) => {
              updateValue('postalCode', postalCode);
              updateValue('addressLine1', addressLine1);
              setErrors(currentErrors => ({
                ...currentErrors,
                address: undefined,
              }));
            }}
            onAddressLine2Change={value => updateValue('addressLine2', value)}
            onSearchUnavailable={handleAddressSearchUnavailable}
          />
        </div>

        <div className={fieldRowClassName}>
          <label htmlFor="delivery-note" className={fieldLabelClassName}>
            배송 메모{' '}
            <span className="ml-1 text-sm font-medium text-zinc-500">
              (선택)
            </span>
          </label>
          <Textarea
            id="delivery-note"
            value={values.deliveryNote}
            onChange={event => updateValue('deliveryNote', event.target.value)}
            placeholder="배송 시 요청사항을 입력해 주세요"
            className="min-h-24 border-zinc-300 bg-white text-sm font-medium shadow-none hover:ring-[3px] hover:ring-black/70 focus-visible:border-zinc-300 focus-visible:ring-black/70"
          />
        </div>

        <div className={fieldRowClassName}>
          <p className={fieldLabelClassName}>기본 배송지</p>
          <div className="flex h-9 items-center gap-2">
            <Checkbox
              id="is-default-address"
              checked={values.isDefault}
              onCheckedChange={checked =>
                updateValue('isDefault', checked === true)
              }
            />
            <label
              htmlFor="is-default-address"
              className="cursor-pointer text-sm font-bold text-black"
            >
              기본 배송지로 설정
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end px-5 pt-3 pb-6 md:px-6">
        <div className="flex w-full gap-2 md:w-auto">
          <ButtonLink
            href={returnHref}
            variant="outline"
            size="lg"
            className="flex-1 border-zinc-300 bg-white font-bold shadow-none hover:border-black hover:bg-white hover:text-black md:w-30 md:flex-none"
          >
            취소
          </ButtonLink>
          <Button
            type="submit"
            size="lg"
            className="flex-1 bg-black font-bold text-white hover:bg-zinc-800 md:w-30 md:flex-none"
          >
            {isEditMode ? '수정' : '등록'}
          </Button>
        </div>
      </div>
    </form>
  );
}
