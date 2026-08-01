import type { OrderRefundViewModel } from '@/domains/order';

interface MypageOrderCardPaymentSummaryProps {
  finalAmountText: string;
  refunds: OrderRefundViewModel[];
}

export function MypageOrderCardPaymentSummary({
  finalAmountText,
  refunds,
}: MypageOrderCardPaymentSummaryProps) {
  const completedRefunds = refunds.filter(refund => refund.status === 'completed');

  return (
    <footer className="space-y-2 border-t border-zinc-200 px-4 py-4 md:px-5">
      <MypageOrderCardPaymentAmountRow
        label="총 금액"
        amount={finalAmountText}
        tone="total"
      />
      {completedRefunds.map(refund => (
        <div key={refund.id} className="border-t border-zinc-100 pt-2">
          <MypageOrderCardPaymentAmountRow
            label={refund.label}
            amount={refund.amountText}
            tone="refund"
          />
          <p className="mt-1 text-sm font-medium text-zinc-500">
            {refund.description}
          </p>
        </div>
      ))}
    </footer>
  );
}

interface MypageOrderCardPaymentAmountRowProps {
  label: string;
  amount: string;
  tone?: 'refund' | 'total';
}

function MypageOrderCardPaymentAmountRow({
  label,
  amount,
  tone,
}: MypageOrderCardPaymentAmountRowProps) {
  return (
    <div className="flex items-center justify-between">
      <p
        className={`text-sm font-bold ${
          tone === 'refund' ? 'text-red-700' : 'text-zinc-500'
        }`}
      >
        {label}
      </p>
      <p
        className={`font-black ${
          tone === 'refund'
            ? 'text-red-700'
            : tone === 'total'
              ? 'text-base text-black'
              : 'text-black'
        }`}
      >
        {amount}
      </p>
    </div>
  );
}
