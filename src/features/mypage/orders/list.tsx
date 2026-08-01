import type { OrderListItemViewModel } from '@/domains/order';
import { MypageOrderCard } from './card';

interface MypageOrderListProps {
  orders: OrderListItemViewModel[];
}

export function MypageOrderList({ orders }: MypageOrderListProps) {
  return (
    <div className="space-y-6">
      {orders.map(order => (
        <MypageOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
