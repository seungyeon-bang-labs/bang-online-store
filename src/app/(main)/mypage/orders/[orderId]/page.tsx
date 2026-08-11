import { notFound } from 'next/navigation';
import { getMypageOrderDetailViewModel } from '@/domains/mypage';
import { MypageSectionHeader } from '@/features/mypage/common';
import { MypageOrderDetail } from '@/features/mypage/orders';

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const orderDetailViewModel = await getMypageOrderDetailViewModel(orderId);

  if (!orderDetailViewModel) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="주문 상세" />
      <MypageOrderDetail orderDetail={orderDetailViewModel} />
    </div>
  );
}

export default OrderDetailPage;
