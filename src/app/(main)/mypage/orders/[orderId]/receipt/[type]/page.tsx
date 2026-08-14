import { notFound } from 'next/navigation';
import {
  getMypageOrderReceiptViewModel,
  isMypageOrderReceiptDocumentType,
} from '@/domains/mypage';
import { MypageOrderReceipt } from '@/features/mypage/orders';

interface OrderReceiptDocumentPageProps {
  params: Promise<{ orderId: string; type: string }>;
}

async function OrderReceiptDocumentPage({
  params,
}: OrderReceiptDocumentPageProps) {
  const { orderId, type } = await params;
  if (!isMypageOrderReceiptDocumentType(type)) notFound();

  const receipt = await getMypageOrderReceiptViewModel(orderId, type);
  if (!receipt) notFound();

  return <MypageOrderReceipt receipt={receipt} />;
}

export default OrderReceiptDocumentPage;
