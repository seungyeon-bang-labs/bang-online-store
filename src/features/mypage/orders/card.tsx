import type { OrderListItemViewModel } from '@/domains/order';
import { MypageOrderCardHeader } from './card-header';
import { MypageOrderCardItems } from './card-items';

interface MypageOrderCardProps {
  order: OrderListItemViewModel;
}

export function MypageOrderCard({ order }: MypageOrderCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <MypageOrderCardHeader
        orderId={order.id}
        status={order.status}
        statusCode={order.statusCode}
        statusDescription={order.statusDescription}
        cancelledItemCount={order.cancelledItemCount}
      />
      <MypageOrderCardItems
        items={order.items}
        finalAmountText={order.finalAmountText}
        refunds={order.refunds}
      />
    </article>
  );
}
