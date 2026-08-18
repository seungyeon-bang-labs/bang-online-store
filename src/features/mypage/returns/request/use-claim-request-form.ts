import { useState } from 'react';
import type {
  OrderClaimRequestReason,
  OrderClaimRequestType,
} from '@/domains/order/domain';
import type { OrderClaimRequestViewModel } from '@/domains/order/view-model';

export interface ClaimRequestErrors {
  type?: string;
  reason?: string;
  description?: string;
  exchangeOption?: string;
  agreement?: string;
}

export function useClaimRequestForm(
  claimRequest: OrderClaimRequestViewModel,
) {
  const [type, setType] = useState<OrderClaimRequestType | null>(null);
  const [reason, setReason] = useState<OrderClaimRequestReason | ''>('');
  const [description, setDescription] = useState('');
  const [exchangeProductId, setExchangeProductId] = useState<number | null>(
    null,
  );
  const [exchangeOptionId, setExchangeOptionId] = useState('');
  const [hasChangedExchangeOption, setHasChangedExchangeOption] =
    useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<ClaimRequestErrors>({});

  const isDescriptionRequired = reason === 'other';

  function selectType(nextType: OrderClaimRequestType) {
    setType(nextType);
    setExchangeProductId(
      nextType === 'exchange' ? claimRequest.currentProductId : null,
    );
    setExchangeOptionId(
      nextType === 'exchange' ? claimRequest.currentVariantId : '',
    );
    setHasChangedExchangeOption(false);
    setErrors(current => ({ ...current, type: undefined }));
  }

  function selectReason(nextReason: OrderClaimRequestReason) {
    setReason(nextReason);
    setErrors(current => ({ ...current, reason: undefined }));
  }

  function updateDescription(nextDescription: string) {
    setDescription(nextDescription);
    setErrors(current => ({ ...current, description: undefined }));
  }

  function selectExchangeOption(productId: number, variantId: string) {
    setExchangeProductId(productId);
    setExchangeOptionId(variantId);
    setHasChangedExchangeOption(
      productId !== claimRequest.currentProductId ||
        variantId !== claimRequest.currentVariantId,
    );
    setErrors(current => ({ ...current, exchangeOption: undefined }));
  }

  function updateAgreement(nextAgreed: boolean) {
    setAgreed(nextAgreed);
    setErrors(current => ({ ...current, agreement: undefined }));
  }

  function submit(): OrderClaimRequestType | null {
    const nextErrors: ClaimRequestErrors = {
      ...(!type ? { type: '교환 또는 반품을 선택해 주세요.' } : {}),
      ...(!reason ? { reason: '신청 사유를 선택해 주세요.' } : {}),
      ...(isDescriptionRequired && description.trim().length < 10
        ? { description: '상세 사유를 10자 이상 입력해 주세요.' }
        : {}),
      ...(type === 'exchange' && !hasChangedExchangeOption
        ? { exchangeOption: '교환할 옵션을 선택해 주세요.' }
        : {}),
      ...(!agreed ? { agreement: '유의사항 동의가 필요합니다.' } : {}),
    };

    setErrors(nextErrors);

    return type && Object.keys(nextErrors).length === 0 ? type : null;
  }

  return {
    agreed,
    description,
    errors,
    exchangeOptionId,
    exchangeProductId,
    hasChangedExchangeOption,
    isDescriptionRequired,
    reason,
    selectExchangeOption,
    selectReason,
    selectType,
    submit,
    type,
    updateAgreement,
    updateDescription,
  };
}
