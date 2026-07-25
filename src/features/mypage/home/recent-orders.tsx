import type { MypageHomeRecentOrderViewModel } from '@/domains/mypage';
import { MypageCompactEmptyState } from '../mypage-compact-empty-state';
import { MypageHomeRecentOrderCard } from './recent-order-card';

interface MypageHomeRecentOrdersProps {
  orders: MypageHomeRecentOrderViewModel[];
}

export function MypageHomeRecentOrders({
  orders,
}: MypageHomeRecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <MypageCompactEmptyState
        title="최근 주문이 없습니다."
        description="상품을 주문하면 배송 상태와 주문 내역을 확인할 수 있습니다."
        action={{ href: '/new', label: '상품 보러 가기' }}
      />
    );
  }

  return (
    <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
      {orders.map(order => (
        <MypageHomeRecentOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
