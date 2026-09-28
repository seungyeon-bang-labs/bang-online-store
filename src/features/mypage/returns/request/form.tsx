'use client';

import { Button, ButtonLink } from '@/shared/components/ui/button';
import { InputError } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  type OrderClaimRequestReason,
  type OrderClaimRequestType,
} from '@/domains/order/claim/domain';
import {
  MypageDetailInfoList,
  MypageTextareaCharacterCount,
} from '@/features/mypage/common';
import {
  MypageFormField,
  MypageFormFooter,
  MypageFormLabel,
} from '@/features/mypage/common/form';
import {
  MYPAGE_INPUT_CLASS_NAME,
  MYPAGE_TEXTAREA_CLASS_NAME,
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME,
} from '@/features/mypage/common/styles';
import type { OrderClaimRequestViewModel } from '@/domains/order/claim/view-model';
import { MypageClaimRequestAgreement } from './claim-agreement';
import { MypageClaimRequestProcessingGuide } from './claim-processing-guide';
import { MypageClaimRequestTypeSelector } from './claim-type-selector';
import { MypageClaimExchangeOptionSelector } from './exchange-option-selector';
import { MypageClaimRequestProductSummary } from './product-summary';
import { useClaimRequestForm } from './use-claim-request-form';

const CLAIM_REASONS: ReadonlyArray<{
  value: OrderClaimRequestReason;
  label: string;
}> = [
    { value: 'change_of_mind', label: '단순 변심' },
    { value: 'size_or_color', label: '사이즈 또는 색상 변경' },
    { value: 'defective_or_wrong', label: '상품 불량 또는 오배송' },
    { value: 'other', label: '기타' },
  ];

interface MypageClaimRequestFormProps {
  claimRequest: OrderClaimRequestViewModel;
  returnHref: string;
  onSubmitted: (type: OrderClaimRequestType) => void;
}

export function MypageClaimRequestForm({
  claimRequest,
  returnHref,
  onSubmitted,
}: MypageClaimRequestFormProps) {
  const {
    agreed,
    description,
    errors,
    exchangeOptionId,
    exchangeProductId,
    isDescriptionRequired,
    reason,
    selectExchangeOption,
    selectReason,
    selectType,
    submit,
    type,
    updateAgreement,
    updateDescription,
  } = useClaimRequestForm(claimRequest);

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        const submittedType = submit();

        if (submittedType) onSubmitted(submittedType);
      }}
      noValidate
    >
      <section className="p-4 md:p-5" aria-label="주문 정보">
        <MypageDetailInfoList
          labelWidth="narrow"
          items={[
            {
              id: 'order-number',
              label: '주문 번호',
              value: claimRequest.orderNumber,
              valueClassName: 'break-all font-black',
            },
            {
              id: 'ordered-at',
              label: '주문 날짜',
              value: claimRequest.orderedAt,
            },
          ]}
        />
      </section>
      <MypageClaimRequestProductSummary claimRequest={claimRequest} />
      <section
        className={`border-t border-zinc-200 p-4 md:p-5 ${type !== null ? 'pb-0 md:pb-0' : ''}`}
        aria-labelledby="claim-request-details-title"
      >
        <h2 id="claim-request-details-title" className="sr-only">
          교환·반품 신청 내용
        </h2>
        <MypageClaimRequestTypeSelector
          selectedType={type}
          errorMessage={errors.type}
          errorMessageId="claim-type-error"
          onSelect={selectType}
        />

        {type === null && (
          <p className="mt-4 text-sm font-medium text-zinc-500">
            교환 또는 반품을 선택하면 신청 정보를 입력할 수 있습니다.
          </p>
        )}

        {type !== null && (
          <>
            <MypageFormField className="mt-6 gap-0">
              <MypageFormLabel htmlFor="claim-reason" requirement="required">
                사유
              </MypageFormLabel>
              <Select
                value={reason}
                onValueChange={value =>
                  selectReason(value as OrderClaimRequestReason)
                }
              >
                <SelectTrigger
                  id="claim-reason"
                  aria-invalid={Boolean(errors.reason)}
                  aria-describedby={errors.reason ? 'claim-reason-error' : undefined}
                  className={`mt-2 w-full ${MYPAGE_INPUT_CLASS_NAME}`}
                >
                  <SelectValue placeholder="사유를 선택해 주세요" />
                </SelectTrigger>
                <SelectContent className="border-zinc-300 bg-white">
                  {CLAIM_REASONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <InputError id="claim-reason-error" message={errors.reason} />
            </MypageFormField>

            {type === 'exchange' && (
              <MypageClaimExchangeOptionSelector
                colorOptions={claimRequest.exchangeColorOptions}
                currentProductId={claimRequest.currentProductId}
                currentVariantId={claimRequest.currentVariantId}
                currentVariantLabel={claimRequest.currentVariantLabel}
                selectedProductId={
                  exchangeProductId ?? claimRequest.currentProductId
                }
                selectedVariantId={exchangeOptionId}
                errorMessage={errors.exchangeOption}
                errorMessageId="claim-exchange-option-error"
                onSelectionChange={selectExchangeOption}
              />
            )}

            <div className="mt-6" aria-labelledby="claim-request-description-title">
              <MypageFormLabel id="claim-request-description-title"
                htmlFor="claim-description" requirement={isDescriptionRequired ? 'required' : 'optional'}>
                상세 사유
              </MypageFormLabel>
              <div className="relative mt-2">
                <Textarea
                  id="claim-description"
                  value={description}
                  onChange={event => updateDescription(event.target.value)}
                  maxLength={500}
                  aria-describedby={
                    errors.description ? 'claim-description-error' : undefined
                  }
                  placeholder={
                    isDescriptionRequired
                      ? '기타 사유를 10자 이상 입력해 주세요.'
                      : '추가로 전달할 내용이 있으면 입력해 주세요.'
                  }
                  className={`min-h-28 resize-y pb-10 ${MYPAGE_TEXTAREA_CLASS_NAME}`}
                />
                <MypageTextareaCharacterCount current={description.length} max={500} />
              </div>
              <InputError
                id="claim-description-error"
                message={errors.description}
                className="mt-2"
              />
            </div>

            <MypageClaimRequestProcessingGuide
              claimRequest={claimRequest}
              type={type}
              reason={reason}
            />
          </>
        )}

        {type !== null && (
          <MypageClaimRequestAgreement
            agreed={agreed}
            errorMessage={errors.agreement}
            errorMessageId="claim-agreement-error"
            onAgreementChange={updateAgreement}
          />
        )}
      </section>
      <MypageFormFooter>
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
          disabled={type === null}
          className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.primary}`}
        >
          {type === null
            ? '신청'
            : type === 'exchange'
              ? '교환 신청'
              : '반품 신청'}
        </Button>
      </MypageFormFooter>
    </form>
  );
}
