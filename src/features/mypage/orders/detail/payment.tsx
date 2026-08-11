import type { MypageOrderDetailPaymentViewModel } from '@/domains/mypage';

interface MypageOrderDetailPaymentProps {
  payment: MypageOrderDetailPaymentViewModel;
}

export function MypageOrderDetailPayment({
  payment,
}: MypageOrderDetailPaymentProps) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-200 p-4 md:p-5">
        <h3 className="font-black text-black">결제 정보</h3>
      </header>
      <div className="space-y-2 p-4 md:p-5">
        <PaymentRow label="상품 금액" amount={payment.subtotalAmountText} />
        {payment.hasDiscount ? (
          <PaymentRow
            label="할인 금액"
            amount={`- ${payment.discountAmountText}`}
            tone="discount"
          />
        ) : null}
        {payment.pointUsageAmountText ? (
          <PaymentRow
            label="적립금 사용"
            amount={`- ${payment.pointUsageAmountText}`}
            tone="discount"
          />
        ) : null}
        <PaymentRow
          label="배송비"
          amount={payment.isFreeShipping ? '무료 배송' : payment.shippingFeeText}
        />
        <div className="border-t border-zinc-200 pt-3">
          <PaymentRow
            label="총 결제 금액"
            amount={payment.totalAmountText}
            tone="total"
          />
        </div>
        <div className="border-t border-zinc-100 pt-3">
          <PaymentRow label="결제 수단" amount={payment.paymentMethod} />
        </div>
      </div>
    </section>
  );
}

interface PaymentRowProps {
  label: string;
  amount: string;
  tone?: 'discount' | 'total';
}

function PaymentRow({ label, amount, tone }: PaymentRowProps) {
  const isAccent = tone === 'discount';

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <p className="font-bold text-zinc-500">{label}</p>
      <p
        className={`text-right font-black ${
          isAccent
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
