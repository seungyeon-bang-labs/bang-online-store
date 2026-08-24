import {
  getOrderClaimExpectedRefundAmount,
  getOrderClaimRequestShippingFee,
  isOrderClaimInspectionRequired,
  type OrderClaimRequestReason,
  type OrderClaimRequestType,
} from '@/domains/order/claim/domain';
import type { OrderClaimRequestViewModel } from '@/domains/order/claim/view-model';
import { formatKoreanMoney } from '@/shared/lib/format';

interface MypageClaimRequestProcessingGuideProps {
  reason: OrderClaimRequestReason | '';
  claimRequest: OrderClaimRequestViewModel;
  type: OrderClaimRequestType;
}

export function MypageClaimRequestProcessingGuide({
  reason,
  claimRequest,
  type,
}: MypageClaimRequestProcessingGuideProps) {
  const shippingFee = getOrderClaimRequestShippingFee(reason);
  const expectedRefundAmount = getOrderClaimExpectedRefundAmount({
    itemAmount: claimRequest.itemAmount,
    reason,
  });
  const requiresInspection = isOrderClaimInspectionRequired(reason);
  return (
    <div
      className="mt-7 rounded-sm bg-zinc-50 p-4"
      aria-label={type === 'exchange' ? '교환 처리 안내' : '반품 처리 안내'}
    >
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-zinc-500">회수 주소</dt>
          <dd className="max-w-[70%] text-right font-bold text-black">
            {claimRequest.collectionAddressText}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-zinc-500">회수 일정</dt>
          <dd className="font-bold text-black">
            신청 후 1~3영업일 내 방문 예정
          </dd>
        </div>
        {type === 'exchange' && (
          <div className="flex justify-between gap-4">
            <dt className="shrink-0 font-medium text-zinc-500">
              교환 상품 발송
            </dt>
            <dd className="max-w-[70%] text-right font-bold text-black">
              회수 및 검수 완료 후 1~3영업일 내 발송 예정
            </dd>
          </div>
        )}
        {type === 'exchange' && (
          <p className="border-t border-zinc-200 pt-3 font-medium text-zinc-600">
            교환은 구매한 옵션과 동일한 가격의 옵션으로만 신청할 수 있습니다.
            가격이 다른 옵션은 반품 후 재주문해 주세요.
          </p>
        )}
        {type === 'return' && reason && (
          <>
            <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3">
              <dt className="font-medium text-zinc-500">상품 금액</dt>
              <dd className="font-bold text-black">
                {claimRequest.itemAmountText}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-medium text-zinc-500">반품 배송비</dt>
              <dd className="font-bold text-black">
                {shippingFee === null
                  ? '검수 후 결정'
                  : shippingFee === 0
                    ? '무료'
                    : `- ${formatKoreanMoney(shippingFee)}`}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-zinc-200 pt-3">
              <dt className="font-black text-black">환불 예상 금액</dt>
              <dd className="font-black text-black">
                {expectedRefundAmount === null
                  ? '검수 후 안내'
                  : formatKoreanMoney(expectedRefundAmount)}
              </dd>
            </div>
          </>
        )}
      </dl>
      {type === 'return' && !reason && (
        <p className="mt-4 text-sm font-medium text-zinc-500">
          신청 사유를 선택하면 반품 배송비와 환불 예상 금액을 안내합니다.
        </p>
      )}
      {requiresInspection && (
        <p className="mt-4 text-sm font-medium leading-6 text-zinc-600">
          상품 상태와 검수 결과에 따라 교환·환불 가능 여부 및 비용 부담이 결정될 수 있습니다.
        </p>
      )}
    </div>
  );
}
