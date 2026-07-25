import { Truck } from 'lucide-react';
import type {
  MypageHomeOrderStatusViewModel,
  MypageHomeRecentOrderViewModel,
} from '@/domains/mypage';
import { buildQueryHref } from '@/shared/lib/query';
import { MypageHomeOrderStatuses } from './order-statuses';
import { MypageHomeRecentOrders } from './recent-orders';
import { MypageHomeSectionHeader } from './section-header';

interface MypageHomeOrdersProps {
  statuses: MypageHomeOrderStatusViewModel[];
  orders: MypageHomeRecentOrderViewModel[];
}

export function MypageHomeOrders({ statuses, orders }: MypageHomeOrdersProps) {
  return (
    <section className="space-y-5">
      <MypageHomeSectionHeader
        title="최근 주문/배송"
        icon={<Truck className="size-4" />}
        viewAllHref={buildQueryHref('/mypage/orders', {
          period: '3-months',
          status: 'all',
          page: 1,
        })}
      />

      <MypageHomeOrderStatuses items={statuses} />
      <MypageHomeRecentOrders orders={orders} />
    </section>
  );
}
