'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { InputError } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { OrderCancellationPreviewViewModel } from '@/domains/order/cancellation';
import { MypageOrderCancellationProductSummary } from './product-summary';

const CANCELLATION_REASONS = [
  '단순 변심',
  '중복 주문',
  '배송 지연',
  '기타',
] as const;
const OTHER_CANCELLATION_REASON = '기타';

interface MypageOrderCancellationFormProps {
  preview: OrderCancellationPreviewViewModel;
  returnHref: string;
  onSubmitted: () => void;
}

export function MypageOrderCancellationForm({
  preview,
  returnHref,
  onSubmitted,
}: MypageOrderCancellationFormProps) {
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<{
    reason?: string;
    otherReason?: string;
    agreement?: string;
  }>({});
  const isOtherReason = reason === OTHER_CANCELLATION_REASON;
  const isOtherReasonValid =
    !isOtherReason || otherReason.trim().length >= 10;
  const canSubmit = Boolean(reason) && agreed && isOtherReasonValid;

  const submit = () => {
    const nextErrors = {
      reason: reason ? undefined : '취소 사유를 선택해 주세요.',
      otherReason: isOtherReasonValid
        ? undefined
        : '기타 취소 사유를 10자 이상 입력해 주세요.',
      agreement: agreed ? undefined : '취소 및 환불 안내를 확인해 주세요.',
    };

    setErrors(nextErrors);

    if (!nextErrors.reason && !nextErrors.otherReason && !nextErrors.agreement) {
      onSubmitted();
    }
  };

  return (
    <form
      noValidate
      onSubmit={event => {
        event.preventDefault();
        submit();
      }}
    >
      <section className="p-4 md:p-5" aria-label="주문 정보">
        <dl className="space-y-2 text-sm">
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 font-medium text-zinc-500">주문 날짜</dt>
            <dd className="text-right font-bold text-black">{preview.orderedAt}</dd>
          </div>
          <div className="flex items-start justify-between gap-4">
            <dt className="shrink-0 font-medium text-zinc-500">주문 번호</dt>
            <dd className="min-w-0 break-all text-right font-black text-black">
              {preview.orderNumber}
            </dd>
          </div>
        </dl>
      </section>

      <MypageOrderCancellationProductSummary item={preview.item} />

      <section className="border-t border-zinc-300 p-4 md:p-5" aria-label="취소 사유">
        <div>
          <label htmlFor="cancellation-reason" className="font-bold text-black">
            취소 사유{' '}
            <span className="ml-1 text-sm font-medium text-zinc-500">(필수)</span>
          </label>
          <Select
            value={reason}
            onValueChange={value => {
              setReason(value);
              if (value !== OTHER_CANCELLATION_REASON) setOtherReason('');
              setErrors(currentErrors => ({
                ...currentErrors,
                reason: undefined,
                otherReason: undefined,
              }));
            }}
          >
            <SelectTrigger
              id="cancellation-reason"
              aria-invalid={Boolean(errors.reason)}
              className="mt-2 h-10 w-full rounded-sm border-zinc-300 bg-white font-medium shadow-none focus-visible:border-black focus-visible:ring-0"
            >
              <SelectValue placeholder="취소 사유를 선택해 주세요" />
            </SelectTrigger>
            <SelectContent className="border-zinc-300 bg-white">
              {CANCELLATION_REASONS.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <InputError message={errors.reason} />
          {isOtherReason ? (
            <>
              <Textarea
                aria-label="기타 사유"
                value={otherReason}
                onChange={event => {
                  setOtherReason(event.target.value);
                  setErrors(currentErrors => ({
                    ...currentErrors,
                    otherReason: undefined,
                  }));
                }}
                placeholder="취소 사유를 입력해 주세요."
                maxLength={200}
                aria-invalid={Boolean(errors.otherReason)}
                className="mt-2 min-h-28 resize-y rounded-sm border-zinc-300 bg-white text-sm shadow-none focus-visible:border-black focus-visible:ring-0"
              />
              <div className="mt-2 flex justify-between text-sm font-medium">
                <InputError message={errors.otherReason} className="mt-0" />
                <span className="ml-auto text-zinc-400">
                  {otherReason.length} / 200자
                </span>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="p-4 pt-0 md:p-5 md:pt-0" aria-label="환불 예상 정보">
        <div className="rounded-sm bg-zinc-100 px-4 py-4">
          <dl className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="font-bold text-zinc-600">상품 금액</dt>
              <dd className="font-black text-black">{preview.item.lineTotalText}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-bold text-zinc-600">환불 금액</dt>
              <dd className="font-black text-red-700">
                {preview.expectedRefundAmountText}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            결제 수단 및 주문 상태에 따라 실제 환불 금액과 시점이 달라질 수 있습니다.
          </p>
        </div>

        <div className="mt-6 flex items-start gap-3">
          <Checkbox
            id="cancellation-agreement"
            checked={agreed}
            onCheckedChange={value => {
              const isAgreed = value === true;
              setAgreed(isAgreed);
              if (isAgreed) {
                setErrors(currentErrors => ({
                  ...currentErrors,
                  agreement: undefined,
                }));
              }
            }}
            className="mt-0.5 rounded-sm"
          />
          <label
            htmlFor="cancellation-agreement"
            className="text-sm leading-6 text-zinc-700"
          >
            <strong className="mr-1 text-black">[필수]</strong>
            취소 내용과 예상 환불 금액을 확인했습니다.
          </label>
        </div>
        <InputError message={errors.agreement} />

        <div className="mt-5 grid grid-cols-2 gap-2">
          <ButtonLink
            href={returnHref}
            variant="outline"
            className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-white hover:text-black"
          >
            취소
          </ButtonLink>
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-sm bg-black font-bold text-white hover:bg-zinc-800"
          >
            주문 취소 신청
          </Button>
        </div>
      </section>
    </form>
  );
}
