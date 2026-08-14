import type { MypageOrderPurchaseReceiptViewModel } from '@/domains/mypage';
import {
  ReceiptOrderInformation,
  ReceiptPaymentRow,
  ReceiptSection,
} from './receipt-shared';

interface MypageOrderReceiptPurchaseBodyProps {
  receipt: MypageOrderPurchaseReceiptViewModel;
}

export function MypageOrderReceiptPurchaseBody({
  receipt,
}: MypageOrderReceiptPurchaseBodyProps) {
  return (
    <div>
      <ReceiptOrderInformation orderInformation={receipt.orderInformation} />
      <ReceiptSection>
        <ReceiptItems items={receipt.items} />
      </ReceiptSection>
      <ReceiptSection>
        <ReceiptPaymentSummary paymentSummary={receipt.paymentSummary} />
      </ReceiptSection>
    </div>
  );
}

function ReceiptItems({
  items,
}: Pick<MypageOrderPurchaseReceiptViewModel, 'items'>) {
  return (
    <div>
      <h3 className="font-black text-black">주문 상품</h3>
      <ul className="mx-2 mt-3 divide-y divide-zinc-200">
        {items.map(item => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="font-bold text-black">{item.productName}</p>
              <p className="mt-0.5 font-medium text-zinc-500">
                {item.optionLabel} · {item.quantity}개
                {item.statusLabel ? (
                  <>
                    <span aria-hidden="true"> · </span>
                    <span className="font-black text-red-700">
                      {item.statusLabel}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <p className="shrink-0 font-black text-black">{item.amountText}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ReceiptPaymentSummaryProps {
  paymentSummary: MypageOrderPurchaseReceiptViewModel['paymentSummary'];
}

function ReceiptPaymentSummary({
  paymentSummary,
}: ReceiptPaymentSummaryProps) {
  return (
    <div>
      <h3 className="font-black text-black">결제 내역</h3>
      <div className="mx-2 mt-3">
        <div className="space-y-2">
          <ReceiptPaymentRow
            label="상품 금액"
            amount={paymentSummary.subtotalAmountText}
          />
          {paymentSummary.hasDiscount ? (
            <ReceiptPaymentRow
              label="할인 금액"
              amount={`- ${paymentSummary.discountAmountText}`}
              tone="discount"
            />
          ) : null}
          {paymentSummary.pointUsageAmountText ? (
            <ReceiptPaymentRow
              label="적립금 사용"
              amount={`- ${paymentSummary.pointUsageAmountText}`}
              tone="discount"
            />
          ) : null}
          <ReceiptPaymentRow
            label="배송비"
            amount={
              paymentSummary.isFreeShipping
                ? '무료 배송'
                : paymentSummary.shippingFeeText
            }
          />
        </div>
        <div className="mt-3 border-t border-zinc-200 pt-3">
          <ReceiptPaymentRow
            label="최초 결제 금액"
            amount={paymentSummary.originalPaymentAmountText}
            tone="total"
          />
          {paymentSummary.refundedAmountText ? (
            <ReceiptPaymentRow
              label="취소·환불 금액"
              amount={`- ${paymentSummary.refundedAmountText}`}
              tone="discount"
            />
          ) : null}
          {paymentSummary.refundedAmountText ? (
            <ReceiptPaymentRow
              label="최종 결제 금액"
              amount={paymentSummary.finalPaymentAmountText}
              tone="total"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
