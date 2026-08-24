import type { OrderClaimSettlementViewModel } from '@/domains/order/claim/view-model';
import { MypageClaimDetailCollapsibleCard } from './collapsible-card';

interface MypageClaimDetailRefundInformationProps {
  refund: OrderClaimSettlementViewModel;
}

export function MypageClaimDetailRefundInformation({
  refund,
}: MypageClaimDetailRefundInformationProps) {
  return (
    <MypageClaimDetailCollapsibleCard title="환불 정보">
      <div className="p-4 md:p-5">
        {refund.amountText ? (
          <div className="flex items-center justify-between gap-4 text-sm">
            <p className="font-bold text-zinc-500">{refund.label}</p>
            <p className="font-black text-red-600">{refund.amountText}</p>
          </div>
        ) : null}
        <p
          className={`text-sm leading-relaxed text-zinc-600 ${
            refund.amountText ? 'mt-2' : ''
          }`}
        >
          {refund.description}
        </p>
      </div>
    </MypageClaimDetailCollapsibleCard>
  );
}
