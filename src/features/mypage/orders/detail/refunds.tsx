import type { OrderDetailRefundSummaryViewModel } from '@/domains/order';

interface MypageOrderDetailRefundsProps {
  refundSummary: OrderDetailRefundSummaryViewModel;
}

export function MypageOrderDetailRefunds({
  refundSummary,
}: MypageOrderDetailRefundsProps) {
  if (refundSummary.items.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-200 p-4 md:p-5">
        <h3 className="font-black text-black">환불 정보</h3>
      </header>
      <div className="p-4 md:p-5">
        <div className="divide-y divide-zinc-100">
          {refundSummary.items.map(item => (
            <div key={item.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-4 text-sm">
                <p className="font-bold text-zinc-500">{item.label}</p>
                <p className="text-right font-black text-red-700">
                  {item.amountText}
                </p>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
        {refundSummary.finalPaymentAmountText ? (
          <div className="mt-3 border-t border-zinc-200 pt-3">
            <div className="flex items-center justify-between gap-4 text-sm">
              <p className="font-bold text-zinc-500">환불 후 결제 금액</p>
              <p className="text-right text-base font-black text-black">
                {refundSummary.finalPaymentAmountText}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
