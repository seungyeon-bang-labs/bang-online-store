import { notFound } from 'next/navigation';
import { getMypageOrderReceiptDocumentListViewModel } from '@/domains/mypage';
import { currentUserRepository } from '@/domains/member';
import {
  MypagePageLayout,
  MypagePageHeader,
} from '@/features/mypage/common';
import { MypageOrderReceiptDocumentList } from '@/features/mypage/orders';

interface OrderReceiptPageProps {
  params: Promise<{ orderId: string }>;
}

async function OrderReceiptPage({ params }: OrderReceiptPageProps) {
  const [{ orderId }, user] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
  ]);
  const receiptDocumentList = user
    ? await getMypageOrderReceiptDocumentListViewModel(user.id, orderId)
    : null;

  if (!receiptDocumentList) notFound();

  return (
    <MypagePageLayout className="-mt-5 md:mt-0">
      <MypagePageHeader title="영수증 조회" />
      <MypageOrderReceiptDocumentList receiptDocumentList={receiptDocumentList} />
    </MypagePageLayout>
  );
}

export default OrderReceiptPage;
