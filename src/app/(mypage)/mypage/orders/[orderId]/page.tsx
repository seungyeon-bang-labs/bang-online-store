import { notFound } from 'next/navigation';
import { getMypageOrderDetailViewModel } from '@/domains/mypage';
import { currentUserRepository } from '@/domains/member';
import { MypagePageLayout, MypagePageHeader } from '@/features/mypage/common';
import {
  MypageOrderDetailHeader,
  MypageOrderDetailItems,
  MypageOrderDetailPayment,
  MypageOrderDetailPointBenefits,
  MypageOrderDetailRefunds,
  MypageOrderDetailShipping,
  MypageOrderDetailStatusHistory,
} from '@/features/mypage/orders/detail';

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [{ orderId }, user] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
  ]);
  const orderDetailViewModel = user
    ? await getMypageOrderDetailViewModel(user.id, orderId)
    : null;

  if (!orderDetailViewModel) {
    notFound();
  }

  const { order, payment, pointBenefits } = orderDetailViewModel;

  return (
    <MypagePageLayout mobileSpacing="flush">
      <MypagePageHeader title="주문 상세" />
      <div className="space-y-4">
        <MypageOrderDetailHeader order={order} />
        <MypageOrderDetailStatusHistory histories={order.statusHistory} />
        <MypageOrderDetailItems items={order.items} orderId={order.id} />
        <MypageOrderDetailShipping shipping={order.shipping} />
        <MypageOrderDetailPayment payment={payment} />
        <MypageOrderDetailPointBenefits benefits={pointBenefits} />
        <MypageOrderDetailRefunds refundSummary={order.refund} />
      </div>
    </MypagePageLayout>
  );
}

export default OrderDetailPage;
