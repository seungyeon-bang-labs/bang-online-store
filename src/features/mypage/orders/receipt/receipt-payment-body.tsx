import type { MypageOrderPaymentReceiptViewModel } from '@/domains/mypage';
import {
  ReceiptInformationRow,
  ReceiptOrderInformation,
  ReceiptSection,
} from './receipt-shared';

interface MypageOrderReceiptPaymentBodyProps {
  receipt: MypageOrderPaymentReceiptViewModel;
}

export function MypageOrderReceiptPaymentBody({
  receipt,
}: MypageOrderReceiptPaymentBodyProps) {
  return (
    <div>
      <ReceiptOrderInformation orderInformation={receipt.orderInformation} />
      <ReceiptSection>
        <div>
          <h3 className="font-black text-black">{receipt.paymentDetail.title}</h3>
          <dl className="mx-2 mt-3 space-y-2 text-sm">
            {receipt.paymentDetail.rows.map(row => (
              <ReceiptInformationRow
                key={row.label}
                label={row.label}
                value={row.value}
              />
            ))}
          </dl>
        </div>
      </ReceiptSection>
      <ReceiptSection>
        <div>
          <h3 className="font-black text-black">결제·취소 내역</h3>
          <ul className="mx-2 mt-3 divide-y divide-zinc-200">
            {receipt.paymentTransactions.map(transaction => (
              <li
                key={transaction.id}
                className="flex justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-bold text-black">{transaction.label}</p>
                  <p className="mt-0.5 font-medium text-zinc-500">
                    {transaction.occurredAt}
                  </p>
                </div>
                <p
                  className={
                    transaction.tone === 'refund'
                      ? 'font-black text-red-700'
                      : 'font-black text-black'
                  }
                >
                  {transaction.amountText}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </ReceiptSection>
    </div>
  );
}
