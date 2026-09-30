import type {
  MypageHomeOrderStatusViewModel,
  MypageHomeRecentOrderViewModel,
} from '@/domains/mypage';
import { SectionHeader } from '@/shared/components/common/section-header';
import { buildQueryHref } from '@/shared/lib/query';
import { MypageHomeOrderStatuses } from './order-statuses';
import { MypageHomeRecentOrders } from './recent-orders';

interface MypageHomeOrdersProps {
  statuses: MypageHomeOrderStatusViewModel[];
  orders: MypageHomeRecentOrderViewModel[];
}

export function MypageHomeOrders({ statuses, orders }: MypageHomeOrdersProps) {
  return (
    <section className="space-y-3 md:space-y-5">
      <SectionHeader
        title="최근 주문"
        viewAllHref={buildQueryHref('/mypage/orders', {
          period: 'all',
          status: 'all',
          page: 1,
        })}
      />

      <div className="space-y-4 md:space-y-5">
        <MypageHomeOrderStatuses items={statuses} />
        <MypageHomeRecentOrders orders={orders} />
      </div>
    </section>
  );
}
