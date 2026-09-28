import type { OrderDetailRefundSummaryViewModel } from '@/domains/order';
import { MypageAmountRow, MypageCard } from '@/features/mypage/common';

interface MypageOrderDetailRefundsProps {
  refundSummary: OrderDetailRefundSummaryViewModel;
}

export function MypageOrderDetailRefunds({
  refundSummary,
}: MypageOrderDetailRefundsProps) {
  if (refundSummary.items.length === 0) return null;

  return (
    <MypageCard.Collapsible title="환불 정보" mobileLayout="full-bleed">
      <MypageCard.Body>
        <div className="divide-y divide-zinc-100">
          {refundSummary.items.map(item => (
            <div key={item.id} className="py-3 first:pt-0 last:pb-0">
              <MypageAmountRow label={item.label} value={item.amountText} tone="refund" />
              <p className="mt-1 text-sm leading-5 font-medium text-zinc-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
        {refundSummary.finalPaymentAmountText ? (
          <div className="mt-3 border-t border-zinc-200 pt-3">
            <MypageAmountRow
              label="환불 후 결제 금액"
              value={refundSummary.finalPaymentAmountText}
              tone="total"
            />
          </div>
        ) : null}
      </MypageCard.Body>
    </MypageCard.Collapsible>
  );
}
