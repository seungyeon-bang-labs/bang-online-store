'use client';

import { useCallback, useState } from 'react';
import { Button, ButtonLink } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input, InputError } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  formatKoreanPhoneNumber,
  validateUserAddressFormInput,
  type UserAddressFormViewModel,
  type UserAddressCreateInput,
} from '@/domains/member';
import {
  MypageFormCard,
  MypageFormField,
  MypageFormFooter,
  MypageFormLabel,
} from '@/features/mypage/common/form';
import { MypageCard } from '@/features/mypage/common/card';
import {
  MYPAGE_INPUT_CLASS_NAME,
  MYPAGE_TEXTAREA_CLASS_NAME,
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME,
} from '@/features/mypage/common/styles';
import { MypageAddressSearchField } from './address-search-field';
import { MypageAddressSubmissionResult } from './submission-result';
import type { MypageAddressFormMode, MypageAddressFormValues } from './types';

const fieldLabelClassName =
  'text-xs leading-4 font-medium text-zinc-600 md:text-sm md:leading-5 md:font-bold md:text-black';
const addressInputClassName =
  `${MYPAGE_INPUT_CLASS_NAME} h-9 text-xs md:h-10 md:text-sm`;

interface AddressFormErrors {
  recipientName?: string;
  phoneNumber?: string;
  address?: string;
  submission?: string;
}

interface MypageAddressFormProps {
  mode: MypageAddressFormMode;
  returnHref: string;
  initialAddress?: UserAddressFormViewModel;
  onCreateAddress?: (input: UserAddressCreateInput) => Promise<boolean>;
}

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
  onCreateAddress,
}: MypageAddressFormProps) {
  const initialValues = getInitialFormValues(initialAddress);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<AddressFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = mode === 'edit';
  const isDirty =
    values.recipientName !== initialValues.recipientName ||
    values.phoneNumber !== initialValues.phoneNumber ||
    values.postalCode !== initialValues.postalCode ||
    values.addressLine1 !== initialValues.addressLine1 ||
    values.addressLine2 !== initialValues.addressLine2 ||
    values.deliveryNote !== initialValues.deliveryNote ||
    values.isDefault !== initialValues.isDefault;

  function updateValue<Key extends keyof MypageAddressFormValues>(
    key: Key,
    value: MypageAddressFormValues[Key],
  ) {
    setValues(currentValues => ({ ...currentValues, [key]: value }));
    setErrors(currentErrors => ({
      ...currentErrors,
      submission: undefined,
    }));
  }

  async function submitAddress() {
    if (isSubmitting) return;

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

    if (mode !== 'create' || !onCreateAddress) {
      setIsSubmitted(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const isCreated = await onCreateAddress(values);

      if (isCreated) {
        setIsSubmitted(true);
      } else {
        setErrors({
          submission: '배송지를 등록하지 못했습니다. 다시 시도해 주세요.',
        });
      }
    } catch {
      setErrors({
        submission: '배송지를 등록하지 못했습니다. 다시 시도해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleAddressSearchUnavailable = useCallback(() => {
    setErrors(currentErrors => ({
      ...currentErrors,
      address: '주소 검색을 불러오지 못했습니다. 다시 시도해 주세요.',
    }));
  }, []);

  return (
    <MypageFormCard
      title={isEditMode ? '배송지 수정' : '배송지 추가'}
      as="section"
      titleSize="card"
      mobileLayout="full-bleed"
      mobileHeader="hide"
    >
      {isSubmitted ? (
        <MypageAddressSubmissionResult mode={mode} returnHref={returnHref} />
      ) : (
        <form
          noValidate
          onSubmit={event => {
            event.preventDefault();
            void submitAddress();
          }}
        >
        <MypageCard.Body className="space-y-5">
          <MypageFormField
            className="gap-2 md:grid-cols-[120px_minmax(0,1fr)] md:items-center"
          >
            <MypageFormLabel htmlFor="recipient-name" className={fieldLabelClassName}>
              수령인 <span aria-hidden="true" className="text-red-600">*</span>
            </MypageFormLabel>
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
                aria-describedby={
                  errors.recipientName ? 'recipient-name-error' : undefined
                }
                className={addressInputClassName}
              />
              <InputError id="recipient-name-error" message={errors.recipientName} />
            </div>
          </MypageFormField>

          <MypageFormField
            className="gap-2 md:grid-cols-[120px_minmax(0,1fr)] md:items-center"
          >
            <MypageFormLabel htmlFor="phone-number" className={fieldLabelClassName}>
              연락처 <span aria-hidden="true" className="text-red-600">*</span>
            </MypageFormLabel>
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
                aria-describedby={
                  errors.phoneNumber ? 'phone-number-error' : undefined
                }
                className={addressInputClassName}
              />
              <InputError id="phone-number-error" message={errors.phoneNumber} />
            </div>
          </MypageFormField>

          <MypageFormField layout="horizontal">
            <MypageFormLabel as="p" id="address-label" className={fieldLabelClassName}>
              주소 <span aria-hidden="true" className="text-red-600">*</span>
            </MypageFormLabel>
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
          </MypageFormField>

          <MypageFormField layout="horizontal">
            <MypageFormLabel htmlFor="delivery-note" className={fieldLabelClassName}>
              배송 메모
            </MypageFormLabel>
            <Textarea
              id="delivery-note"
              value={values.deliveryNote}
              onChange={event => updateValue('deliveryNote', event.target.value)}
              placeholder="배송 시 요청사항을 입력해 주세요"
              className={`min-h-24 ${MYPAGE_TEXTAREA_CLASS_NAME} !text-xs md:!text-sm`}
            />
          </MypageFormField>

          <MypageFormField
            layout="horizontal"
            className="grid-cols-1 items-center gap-3 md:grid-cols-[120px_minmax(0,1fr)] md:items-center"
          >
            <MypageFormLabel as="p" className={`hidden md:block ${fieldLabelClassName}`}>
              기본 배송지
            </MypageFormLabel>
            <div className="flex h-10 items-center gap-2">
              <Checkbox
                id="is-default-address"
                checked={values.isDefault}
                onCheckedChange={checked =>
                  updateValue('isDefault', checked === true)
                }
              />
              <label
                htmlFor="is-default-address"
                className="cursor-pointer text-xs font-medium text-zinc-700 md:text-sm md:font-bold md:text-black"
              >
                기본 배송지로 설정
              </label>
            </div>
          </MypageFormField>
        </MypageCard.Body>

        <MypageFormFooter errorMessage={errors.submission}>
          <ButtonLink
            href={returnHref}
            variant="outline"
            size="lg"
            className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.outline}`}
          >
            취소
          </ButtonLink>
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting || (isEditMode && !isDirty)}
            className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.primary}`}
          >
            {isSubmitting ? (isEditMode ? '수정 중' : '등록 중') : isEditMode ? '수정' : '등록'}
          </Button>
        </MypageFormFooter>
        </form>
      )}
    </MypageFormCard>
  );
}
