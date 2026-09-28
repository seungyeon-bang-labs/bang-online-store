import { notFound } from 'next/navigation';
import {
  getMypageOrderReceiptViewModel,
  isMypageOrderReceiptDocumentType,
} from '@/domains/mypage';
import { currentUserRepository } from '@/domains/member';
import { MypageOrderReceipt } from '@/features/mypage/orders';

interface OrderReceiptDocumentPageProps {
  params: Promise<{ orderId: string; type: string }>;
}

async function OrderReceiptDocumentPage({
  params,
}: OrderReceiptDocumentPageProps) {
  const [{ orderId, type }, user] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
  ]);
  if (!isMypageOrderReceiptDocumentType(type)) notFound();

  const receipt = user
    ? await getMypageOrderReceiptViewModel(user.id, orderId, type)
    : null;
  if (!receipt) notFound();

  return <MypageOrderReceipt receipt={receipt} />;
}

export default OrderReceiptDocumentPage;
