import Image from 'next/image';
import type { OrderListItemViewModel } from '@/domains/order';
import { MypageStatusBadge } from './mypage-status-badge';

export function MypageOrderList({
  orders,
}: {
  orders: OrderListItemViewModel[];
}) {
  return (
    <div className="space-y-4">
      {orders.map(order => (
        <article
          key={order.id}
          className="overflow-hidden rounded-md border border-zinc-300 bg-white"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4 md:p-5">
            <div>
              <p className="text-sm font-black text-black">
                {order.orderedAt}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-400">
                {order.orderNumber}
              </p>
            </div>
            <MypageStatusBadge {...order.status} />
            <p className="font-black text-black">{order.totalAmountText}</p>
          </header>
          <div className="divide-y divide-zinc-100">
            {order.items.map(item => (
              <div
                key={item.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] sm:items-center md:p-5"
              >
                <div className="relative aspect-square overflow-hidden rounded-sm bg-zinc-100">
                  <Image
                    src={item.product.thumbnailUrl}
                    alt={item.productName}
                    fill
                    sizes="(max-width: 640px) 72px, 88px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-black text-black">{item.productName}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-500">
                    {item.optionLabel} · {item.quantity}개
                  </p>
                </div>
                <p className="col-start-2 font-black text-black sm:col-start-auto">
                  {item.lineTotalText}
                </p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
