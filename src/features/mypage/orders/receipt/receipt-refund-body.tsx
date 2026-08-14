import type { MypageOrderRefundReceiptViewModel } from '@/domains/mypage';
import {
  ReceiptOrderInformation,
  ReceiptPaymentRow,
  ReceiptSection,
} from './receipt-shared';

interface MypageOrderReceiptRefundBodyProps {
  receipt: MypageOrderRefundReceiptViewModel;
}

export function MypageOrderReceiptRefundBody({
  receipt,
}: MypageOrderReceiptRefundBodyProps) {
  return (
    <div>
      <ReceiptOrderInformation orderInformation={receipt.orderInformation} />
      <ReceiptSection>
        <ReceiptRefunds refunds={receipt.refunds} />
      </ReceiptSection>
      <ReceiptSection>
        <ReceiptRefundPaymentSummary receipt={receipt} />
      </ReceiptSection>
    </div>
  );
}

function ReceiptRefunds({
  refunds,
}: Pick<MypageOrderRefundReceiptViewModel, 'refunds'>) {
  return (
    <div>
      <h3 className="font-black text-black">취소·환불 내역</h3>
      <ul className="mx-2 mt-3 divide-y divide-zinc-200">
        {refunds.map(refund => (
          <li key={refund.id} className="py-3 text-sm first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-4">
              <p className="font-bold text-black">{refund.label}</p>
              <p className="shrink-0 font-black text-red-700">
                {refund.amountText}
              </p>
            </div>
            {refund.status === 'pending' ? (
              <p className="mt-0.5 font-medium text-zinc-500">
                {refund.occurredAt}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ReceiptRefundPaymentSummaryProps {
  receipt: Pick<
    MypageOrderRefundReceiptViewModel,
    | 'originalPaymentAmountText'
    | 'refundedAmountText'
    | 'finalPaymentAmountText'
  >;
}

function ReceiptRefundPaymentSummary({
  receipt,
}: ReceiptRefundPaymentSummaryProps) {
  return (
    <div>
      <h3 className="font-black text-black">결제·환불 금액</h3>
      <div className="mx-2 mt-3 space-y-2">
        <ReceiptPaymentRow
          label="최초 결제 금액"
          amount={receipt.originalPaymentAmountText}
        />
        <ReceiptPaymentRow
          label="총 환불 금액"
          amount={`- ${receipt.refundedAmountText ?? '0원'}`}
          tone="discount"
        />
        <ReceiptPaymentRow
          label="최종 결제 금액"
          amount={receipt.finalPaymentAmountText}
          tone="total"
        />
      </div>
    </div>
  );
}
