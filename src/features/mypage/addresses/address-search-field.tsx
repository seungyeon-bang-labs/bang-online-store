'use client';

import { useRef } from 'react';
import { Input, InputError } from '@/shared/components/ui/input';
import { MYPAGE_INPUT_CLASS_NAME } from '@/features/mypage/common/styles';
import { MypageAddressSearchButton } from './address-search-button';

interface MypageAddressSearchFieldProps {
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  error?: string;
  onAddressSelect: (address: {
    postalCode: string;
    addressLine1: string;
  }) => void;
  onAddressLine2Change: (value: string) => void;
  onSearchUnavailable: () => void;
}

const selectedAddressClassName =
  'flex min-h-9 items-center rounded-sm border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-600 md:min-h-10 md:text-sm';

const addressInputClassName =
  `${MYPAGE_INPUT_CLASS_NAME} h-9 text-xs md:h-10 md:text-sm`;

export function MypageAddressSearchField({
  postalCode,
  addressLine1,
  addressLine2,
  error,
  onAddressSelect,
  onAddressLine2Change,
  onSearchUnavailable,
}: MypageAddressSearchFieldProps) {
  const addressLine2Ref = useRef<HTMLInputElement>(null);

  return (
    <div
      className="space-y-2"
      aria-labelledby="address-label"
      aria-describedby={error ? 'address-error' : undefined}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <div
          className={selectedAddressClassName}
          aria-label={
            postalCode
              ? `선택한 우편번호 ${postalCode}`
              : '우편번호가 선택되지 않았습니다'
          }
        >
          <span className={postalCode ? '' : 'text-zinc-400'}>
            {postalCode || '우편번호'}
          </span>
        </div>
        <MypageAddressSearchButton
          errorMessageId={error ? 'address-error' : undefined}
          onSelect={address => {
            onAddressSelect(address);
            window.requestAnimationFrame(() => {
              addressLine2Ref.current?.focus();
            });
          }}
          onUnavailable={onSearchUnavailable}
        />
      </div>
      <div
        className={selectedAddressClassName}
        aria-live="polite"
        aria-label={
          addressLine1
            ? `선택한 기본 주소 ${addressLine1}`
            : '기본 주소가 선택되지 않았습니다'
        }
      >
        <span className={addressLine1 ? '' : 'text-zinc-400'}>
          {addressLine1 || '주소 찾기를 이용해 주세요'}
        </span>
      </div>
      <Input
        ref={addressLine2Ref}
        id="address-line-2"
        aria-label="상세 주소"
        autoComplete="address-line2"
        value={addressLine2}
        onChange={event => onAddressLine2Change(event.target.value)}
        placeholder="동, 호수 등 상세 주소를 입력해 주세요"
        aria-describedby={error ? 'address-error' : undefined}
        className={addressInputClassName}
      />
      <InputError id="address-error" message={error} />
    </div>
  );
}
