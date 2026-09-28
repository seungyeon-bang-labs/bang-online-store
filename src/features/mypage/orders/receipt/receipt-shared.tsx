import type { PropsWithChildren } from 'react';
import type { MypageOrderReceiptOrderInformationViewModel } from '@/domains/mypage';
import { BUSINESS_INFO } from '@/shared/constants/business-info';

export function ReceiptSection({ children }: PropsWithChildren) {
  return (
    <section className="border-t border-zinc-200 p-4 md:p-5">
      {children}
    </section>
  );
}

interface ReceiptOrderInformationProps {
  orderInformation: MypageOrderReceiptOrderInformationViewModel;
}

export function ReceiptOrderInformation({
  orderInformation,
}: ReceiptOrderInformationProps) {
  return (
    <section className="p-4 md:p-5">
      <dl className="mx-2 space-y-2 text-sm">
        <ReceiptInformationRow
          label="주문 번호"
          value={orderInformation.orderNumber}
        />
        <ReceiptInformationRow label="결제 일시" value={orderInformation.paidAt} />
        <ReceiptInformationRow
          label="결제 수단"
          value={orderInformation.paymentMethod}
        />
      </dl>
    </section>
  );
}

export function ReceiptSellerInformation() {
  return (
    <section className="text-sm leading-relaxed text-zinc-500">
      <h3 className="font-black text-black">판매자 정보</h3>
      <dl className="mx-2 mt-3 space-y-2">
        <ReceiptInformationRow label="상호" value={BUSINESS_INFO.companyName} />
        <ReceiptInformationRow
          label="사업자등록번호"
          value={BUSINESS_INFO.registrationNumber}
        />
        <ReceiptInformationRow
          label="통신판매업 신고번호"
          value={BUSINESS_INFO.mailOrderRegistrationNumber}
          stackOnMobile
        />
        <ReceiptInformationRow
          label="고객센터"
          value={`${BUSINESS_INFO.customerServicePhone} · ${BUSINESS_INFO.customerServiceEmail}`}
          stackOnMobile
        />
      </dl>
    </section>
  );
}

export function ReceiptDemoNotice() {
  return (
    <p className="border-t border-zinc-200 bg-zinc-100 p-4 text-xs font-medium leading-relaxed text-zinc-500 md:p-5">
      데모용 문서이며 실제 결제·세무 증빙으로 사용할 수 없습니다.
    </p>
  );
}

interface ReceiptInformationRowProps {
  label: string;
  value: string;
  stackOnMobile?: boolean;
}

export function ReceiptInformationRow({
  label,
  value,
  stackOnMobile = false,
}: ReceiptInformationRowProps) {
  return (
    <div
      className={
        stackOnMobile
          ? 'flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4'
          : 'flex items-start justify-between gap-4'
      }
    >
      <dt className="shrink-0 font-bold text-zinc-500">{label}</dt>
      <dd
        className={
        stackOnMobile
            ? 'min-w-0 self-start break-all text-left font-bold text-black sm:self-auto sm:text-right'
            : 'min-w-0 break-all text-right font-bold text-black'
        }
      >
        {value}
      </dd>
    </div>
  );
}

interface ReceiptPaymentRowProps {
  label: string;
  amount: string;
  tone?: 'discount' | 'total';
}

export function ReceiptPaymentRow({
  label,
  amount,
  tone,
}: ReceiptPaymentRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <p className="font-bold text-zinc-500">{label}</p>
      <p
        className={`text-right font-black ${
          tone === 'discount'
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
