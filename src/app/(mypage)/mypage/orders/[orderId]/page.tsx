import { notFound } from 'next/navigation';
import { requireActiveMember } from '@/app/(auth)/require-active-member';
import { getMypageOrderDetailViewModel } from '@/domains/mypage';
import { createMemberOrderReadServices } from '@/domains/order/member-order-read.server';
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
import { createAuthClient } from '@/shared/lib/supabase/auth-server';

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const [{ orderId }, member] = await Promise.all([
    params,
    requireActiveMember(),
  ]);
  const orderDetailViewModel = await getMypageOrderDetailViewModel(
    createMemberOrderReadServices(await createAuthClient()),
    member.id,
    orderId,
  );

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
