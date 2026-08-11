import type { MypageOrderDetailViewModel } from '@/domains/mypage';
import { MypageOrderDetailHeader } from './header';
import { MypageOrderDetailItems } from './items';
import { MypageOrderDetailPayment } from './payment';
import { MypageOrderDetailPointBenefits } from './point-benefits';
import { MypageOrderDetailRefunds } from './refunds';
import { MypageOrderDetailShipping } from './shipping';
import { MypageOrderDetailStatusHistory } from './status-history';

interface MypageOrderDetailProps {
  orderDetail: MypageOrderDetailViewModel;
}

export function MypageOrderDetail({
  orderDetail,
}: MypageOrderDetailProps) {
  const { order, payment, pointBenefits } = orderDetail;

  return (
    <div className="space-y-4">
      <MypageOrderDetailHeader order={order} />
      <MypageOrderDetailStatusHistory histories={order.statusHistory} />
      <MypageOrderDetailItems items={order.items} />
      <MypageOrderDetailShipping shipping={order.shipping} />
      <MypageOrderDetailPayment payment={payment} />
      <MypageOrderDetailPointBenefits benefits={pointBenefits} />
      <MypageOrderDetailRefunds refundSummary={order.refund} />
    </div>
  );
}
