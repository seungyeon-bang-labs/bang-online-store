import type { OrderClaimSettlementViewModel } from '@/domains/order/claim/view-model';
import { MypageAmountRow, MypageCard } from '@/features/mypage/common';

interface MypageClaimDetailRefundInformationProps {
  refund: OrderClaimSettlementViewModel;
}

export function MypageClaimDetailRefundInformation({
  refund,
}: MypageClaimDetailRefundInformationProps) {
  return (
    <MypageCard.Collapsible title="환불 정보">
      <MypageCard.Body>
        {refund.amountText ? (
          <MypageAmountRow
            label={refund.label}
            value={refund.amountText}
            tone={refund.tone}
          />
        ) : null}
        <p
          className={`text-sm leading-5 font-medium text-zinc-500 ${
            refund.amountText ? 'mt-2' : ''
          }`}
        >
          {refund.description}
        </p>
      </MypageCard.Body>
    </MypageCard.Collapsible>
  );
}
