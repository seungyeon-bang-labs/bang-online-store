'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
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
  ORDER_CANCELLATION_REASON_OPTIONS,
  type OrderCancellationReason,
  type OrderCancellationSubmitInput,
  type OrderCancellationPreviewViewModel,
} from '@/domains/order/cancellation';
import {
  MypageAmountRow,
  MypageDetailInfoList,
  MypageTextareaCharacterCount,
} from '@/features/mypage/common';
import { MypageFormFooter, MypageFormLabel } from '@/features/mypage/common/form';
import {
  MYPAGE_INPUT_CLASS_NAME,
  MYPAGE_TEXTAREA_CLASS_NAME,
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME,
} from '@/features/mypage/common/styles';
import { MypageOrderCancellationProductSummary } from './product-summary';

const OTHER_CANCELLATION_REASON = '기타';

interface MypageOrderCancellationFormProps {
  preview: OrderCancellationPreviewViewModel;
  returnHref: string;
  onSubmitted: (input: OrderCancellationSubmitInput) => Promise<boolean>;
}

export function MypageOrderCancellationForm({
  preview,
  returnHref,
  onSubmitted,
}: MypageOrderCancellationFormProps) {
  const [reason, setReason] = useState<OrderCancellationReason | ''>('');
  const [otherReason, setOtherReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    reason?: string;
    otherReason?: string;
    agreement?: string;
    submission?: string;
  }>({});
  const isOtherReason = reason === OTHER_CANCELLATION_REASON;
  const isOtherReasonValid =
    !isOtherReason || otherReason.trim().length >= 10;

  const submit = async () => {
    if (isSubmitting) return;

    const nextErrors = {
      reason: reason ? undefined : '취소 사유를 선택해 주세요.',
      otherReason: isOtherReasonValid
        ? undefined
        : '기타 취소 사유를 10자 이상 입력해 주세요.',
      agreement: agreed ? undefined : '취소 및 환불 안내를 확인해 주세요.',
    };

    setErrors(nextErrors);

    if (
      reason &&
      !nextErrors.reason &&
      !nextErrors.otherReason &&
      !nextErrors.agreement
    ) {
      setIsSubmitting(true);

      try {
        const isSubmitted = await onSubmitted({
          reason,
          reasonDetail: otherReason,
        });
        if (!isSubmitted) {
          setErrors({
            submission: '주문 취소를 신청하지 못했습니다. 다시 시도해 주세요.',
          });
        }
      } catch {
        setErrors({
          submission: '주문 취소를 신청하지 못했습니다. 다시 시도해 주세요.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form
      noValidate
      onSubmit={event => {
        event.preventDefault();
        void submit();
      }}
    >
      <section className="p-4 md:p-5" aria-label="주문 정보">
        <MypageDetailInfoList
          labelWidth="narrow"
          items={[
            {
              id: 'ordered-at',
              label: '주문 날짜',
              value: preview.orderedAt,
            },
            {
              id: 'order-number',
              label: '주문 번호',
              value: preview.orderNumber,
              valueClassName: 'break-all font-black',
            },
          ]}
        />
      </section>

      <MypageOrderCancellationProductSummary item={preview.item} />

      <section className="border-t border-zinc-200 p-4 md:p-5" aria-label="취소 사유">
        <div>
          <MypageFormLabel htmlFor="cancellation-reason" requirement="required">
            취소 사유
          </MypageFormLabel>
          <Select
            value={reason}
            onValueChange={value => {
              setReason(value as OrderCancellationReason);
              if (value !== OTHER_CANCELLATION_REASON) setOtherReason('');
              setErrors(currentErrors => ({
                ...currentErrors,
                reason: undefined,
                otherReason: undefined,
                submission: undefined,
              }));
            }}
          >
            <SelectTrigger
              id="cancellation-reason"
              aria-invalid={Boolean(errors.reason)}
              aria-describedby={errors.reason ? 'cancellation-reason-error' : undefined}
              className={`mt-2 w-full ${MYPAGE_INPUT_CLASS_NAME}`}
            >
              <SelectValue placeholder="취소 사유를 선택해 주세요" />
            </SelectTrigger>
            <SelectContent className="border-zinc-300 bg-white">
              {ORDER_CANCELLATION_REASON_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <InputError id="cancellation-reason-error" message={errors.reason} />
          {isOtherReason ? (
            <>
              <div className="relative mt-2">
                <Textarea
                  aria-label="기타 사유"
                  value={otherReason}
                  onChange={event => {
                    setOtherReason(event.target.value);
                    setErrors(currentErrors => ({
                      ...currentErrors,
                      otherReason: undefined,
                      submission: undefined,
                    }));
                  }}
                  placeholder="취소 사유를 입력해 주세요."
                  maxLength={200}
                  aria-invalid={Boolean(errors.otherReason)}
                  aria-describedby={
                    errors.otherReason ? 'cancellation-other-reason-error' : undefined
                  }
                  className={`min-h-28 resize-y pb-10 ${MYPAGE_TEXTAREA_CLASS_NAME}`}
                />
                <MypageTextareaCharacterCount current={otherReason.length} max={200} />
              </div>
              <InputError
                id="cancellation-other-reason-error"
                message={errors.otherReason}
                className="mt-2"
              />
            </>
          ) : null}
        </div>
      </section>

      <section className="px-4 pt-0 md:px-5 md:pt-0" aria-label="환불 예상 정보">
        <div className="rounded-sm bg-zinc-100 px-4 py-4">
          <div className="space-y-2">
            <MypageAmountRow label="상품 금액" value={preview.item.lineTotalText} />
            <MypageAmountRow
              label="예상 환불 금액"
              value={preview.expectedRefundAmountText}
              tone="refund"
            />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            결제 수단 및 주문 상태에 따라 실제 환불 금액과 시점이 달라질 수 있습니다.
          </p>
        </div>

        <div className="mt-4 flex items-start gap-3 md:mt-5">
          <Checkbox
            id="cancellation-agreement"
            checked={agreed}
            aria-describedby={errors.agreement ? 'cancellation-agreement-error' : undefined}
            onCheckedChange={value => {
              const isAgreed = value === true;
              setAgreed(isAgreed);
              if (isAgreed) {
                setErrors(currentErrors => ({
                  ...currentErrors,
                  agreement: undefined,
                  submission: undefined,
                }));
              }
            }}
            className="mt-1.5 cursor-pointer rounded-sm md:mt-1"
          />
          <label
            htmlFor="cancellation-agreement"
            className="cursor-pointer text-sm leading-6 text-zinc-700"
          >
            <strong className="mr-1 text-black">[필수]</strong>
            취소 내용과 예상 환불 금액을 확인했습니다.
          </label>
        </div>
        <InputError id="cancellation-agreement-error" message={errors.agreement} />
      </section>
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
          disabled={isSubmitting}
          className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.primary}`}
        >
          {isSubmitting ? '신청 중' : '주문 취소 신청'}
        </Button>
      </MypageFormFooter>
    </form>
  );
}
