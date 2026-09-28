import type { MypageOrderReceiptViewModel } from '@/domains/mypage';
import { MypageCard } from '@/features/mypage/common';
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
    <MypageCard
      mobileLayout="full-bleed"
      className="print-receipt-page -mt-5 -mb-5 md:my-0"
    >
      <header className="hidden items-center justify-between gap-4 border-b border-zinc-200 p-4 md:flex md:p-5">
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
    </MypageCard>
  );
}
