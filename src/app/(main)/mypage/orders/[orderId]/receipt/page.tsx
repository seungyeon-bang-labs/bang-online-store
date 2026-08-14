import { notFound } from 'next/navigation';
import { getMypageOrderReceiptDocumentListViewModel } from '@/domains/mypage';
import { MypageSectionHeader } from '@/features/mypage/common';
import { MypageOrderReceiptDocumentList } from '@/features/mypage/orders';

interface OrderReceiptPageProps {
  params: Promise<{ orderId: string }>;
}

async function OrderReceiptPage({ params }: OrderReceiptPageProps) {
  const { orderId } = await params;
  const receiptDocumentList =
    await getMypageOrderReceiptDocumentListViewModel(orderId);

  if (!receiptDocumentList) notFound();

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="영수증 조회" />
      <MypageOrderReceiptDocumentList receiptDocumentList={receiptDocumentList} />
    </div>
  );
}

export default OrderReceiptPage;
