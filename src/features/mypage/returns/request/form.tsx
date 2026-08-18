'use client';
import { InputError } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  type OrderClaimRequestReason,
  type OrderClaimRequestType,
} from '@/domains/order/domain';
import type { OrderClaimRequestViewModel } from '@/domains/order/view-model';
import { MypageClaimRequestAgreementActions } from './claim-agreement-actions';
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
  onSubmitted: (type: OrderClaimRequestType) => void;
}

export function MypageClaimRequestForm({
  claimRequest,
  onSubmitted,
}: MypageClaimRequestFormProps) {
  const {
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
        <dl className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 font-medium text-zinc-500">주문 번호</dt>
            <dd className="min-w-0 break-all text-right font-black text-black">
              {claimRequest.orderNumber}
            </dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 font-medium text-zinc-500">주문 날짜</dt>
            <dd className="text-right font-bold text-black">
              {claimRequest.orderedAt}
            </dd>
          </div>
        </dl>
      </section>
      <MypageClaimRequestProductSummary claimRequest={claimRequest} />
      <section
        className="border-t border-zinc-300 p-4 md:p-5"
        aria-labelledby="claim-request-details-title"
      >
        <h2 id="claim-request-details-title" className="sr-only">
          교환·반품 신청 내용
        </h2>
        <MypageClaimRequestTypeSelector
          selectedType={type}
          errorMessage={errors.type}
          onSelect={selectType}
        />

        {type === null && (
          <p className="mt-4 text-sm font-medium text-zinc-500">
            교환 또는 반품을 선택하면 신청 정보를 입력할 수 있습니다.
          </p>
        )}

        {type !== null && (
          <>
            <div className="mt-6">
              <label htmlFor="claim-reason" className="font-bold text-black">
                사유 <span className="ml-1 text-sm font-medium text-zinc-500">(필수)</span>
              </label>
              <Select
                value={reason}
                onValueChange={value =>
                  selectReason(value as OrderClaimRequestReason)
                }
              >
                <SelectTrigger
                  id="claim-reason"
                  aria-invalid={Boolean(errors.reason)}
                  className="mt-2 h-10 w-full rounded-sm border-zinc-300 bg-white font-medium shadow-none focus-visible:border-black focus-visible:ring-0"
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
              <InputError message={errors.reason} />
            </div>

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
                currentItemAmount={claimRequest.itemAmount}
                quantity={claimRequest.quantity}
                errorMessage={errors.exchangeOption}
                onSelectionChange={selectExchangeOption}
              />
            )}

            <div className="mt-7" aria-labelledby="claim-request-description-title">
              <label
                id="claim-request-description-title"
                htmlFor="claim-description"
                className="font-bold text-black"
              >
                상세 사유{' '}
                <span className="ml-1 text-sm font-medium text-zinc-500">
                  {isDescriptionRequired ? '(필수)' : '(선택)'}
                </span>
              </label>
              <Textarea
                id="claim-description"
                value={description}
                onChange={event => updateDescription(event.target.value)}
                maxLength={500}
                placeholder={
                  isDescriptionRequired
                    ? '기타 사유를 10자 이상 입력해 주세요.'
                    : '추가로 전달할 내용이 있으면 입력해 주세요.'
                }
                className="mt-2 min-h-28 resize-y rounded-sm border-zinc-300 text-sm shadow-none"
              />
              <div className="mt-2 flex justify-between text-sm font-medium">
                <InputError message={errors.description} className="mt-0" />
                <span className="ml-auto text-zinc-400">
                  {description.length} / 500자
                </span>
              </div>
            </div>

            <MypageClaimRequestProcessingGuide
              claimRequest={claimRequest}
              type={type}
              reason={reason}
              hasChangedExchangeOption={hasChangedExchangeOption}
              selectedExchangeProductId={exchangeProductId}
              selectedExchangeOptionId={exchangeOptionId}
            />
          </>
        )}

        {type !== null && (
          <MypageClaimRequestAgreementActions
            agreed={agreed}
            errorMessage={errors.agreement}
            onAgreementChange={updateAgreement}
            orderId={claimRequest.orderId}
            type={type}
          />
        )}
      </section>
    </form>
  );
}
