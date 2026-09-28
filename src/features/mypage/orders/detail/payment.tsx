import type { MypageOrderDetailPaymentViewModel } from '@/domains/mypage';
import { MypageAmountRow, MypageCard } from '@/features/mypage/common';

interface MypageOrderDetailPaymentProps {
  payment: MypageOrderDetailPaymentViewModel;
}

export function MypageOrderDetailPayment({
  payment,
}: MypageOrderDetailPaymentProps) {
  return (
    <MypageCard.Collapsible title="결제 정보" mobileLayout="full-bleed">
      <MypageCard.Body className="space-y-2">
        <MypageAmountRow label="상품 금액" value={payment.subtotalAmountText} />
        {payment.hasDiscount ? (
          <MypageAmountRow
            label="상품 할인"
            value={`- ${payment.discountAmountText}`}
            tone="discount"
          />
        ) : null}
        {payment.pointUsageAmountText ? (
          <MypageAmountRow
            label="적립금 사용"
            value={`- ${payment.pointUsageAmountText}`}
            tone="discount"
          />
        ) : null}
        <MypageAmountRow
          label="배송비"
          value={payment.isFreeShipping ? '무료 배송' : payment.shippingFeeText}
        />
        <MypageAmountRow label="결제 수단" value={payment.paymentMethod} />
        <div className="border-t border-zinc-200 pt-3">
          <MypageAmountRow
            label={payment.totalAmountLabel}
            value={payment.totalAmountText}
            tone="total"
          />
        </div>
      </MypageCard.Body>
    </MypageCard.Collapsible>
  );
}
