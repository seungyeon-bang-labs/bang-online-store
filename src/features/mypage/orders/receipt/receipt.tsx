import type { MypageOrderReceiptViewModel } from '@/domains/mypage';
import { MypageOrderReceiptPaymentBody } from './receipt-payment-body';
import { MypageOrderReceiptPurchaseBody } from './receipt-purchase-body';
import { MypageOrderReceiptRefundBody } from './receipt-refund-body';
import {
  ReceiptDemoNotice,
  ReceiptSection,
  ReceiptSellerInformation,
} from './receipt-shared';
import { MypageOrderReceiptPrintButton } from './print-button';

interface MypageOrderReceiptProps {
  receipt: MypageOrderReceiptViewModel;
}

export function MypageOrderReceipt({ receipt }: MypageOrderReceiptProps) {
  const content = (() => {
    switch (receipt.type) {
      case 'purchase':
        return <MypageOrderReceiptPurchaseBody receipt={receipt} />;
      case 'card':
      case 'cash':
        return <MypageOrderReceiptPaymentBody receipt={receipt} />;
      case 'refund':
        return <MypageOrderReceiptRefundBody receipt={receipt} />;
    }
  })();

  return (
    <section className="print-receipt-page overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 p-4 md:p-5">
        <h2 className="text-xl font-black tracking-tight text-black">
          {receipt.title}
        </h2>
        <MypageOrderReceiptPrintButton />
      </header>
      {content}
      <ReceiptSection>
        <ReceiptSellerInformation />
      </ReceiptSection>
      <ReceiptDemoNotice />
    </section>
  );
}
