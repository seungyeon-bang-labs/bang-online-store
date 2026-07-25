import Image from 'next/image';
import Link from 'next/link';
import type { MypageHomeRecentOrderViewModel } from '@/domains/mypage';
import { MypageStatusBadge } from '../mypage-status-badge';
import { MypageHomeOrderActions } from './order-actions';

interface MypageHomeRecentOrderCardProps {
  order: MypageHomeRecentOrderViewModel;
}

export function MypageHomeRecentOrderCard({
  order,
}: MypageHomeRecentOrderCardProps) {
  const firstItem = order.items[0];

  return (
    <article className="grid gap-3 p-3 transition-colors hover:bg-zinc-50 lg:grid-cols-[5.5rem_minmax(0,1fr)_13rem] lg:items-center lg:gap-5">
      <div className="flex items-center lg:justify-center">
        <MypageStatusBadge {...order.status} />
      </div>

      <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-x-4 gap-y-1 lg:grid-cols-[4.5rem_minmax(0,1fr)_auto] lg:items-center lg:gap-x-4">
        {firstItem ? (
          <Link
            href={order.orderHref}
            className="relative row-span-3 aspect-square overflow-hidden rounded-sm bg-zinc-100 outline-none ring-black focus-visible:ring-2 lg:row-span-2"
            aria-label={`${order.productSummary} 주문 조회`}
          >
            <Image
              loading="eager"
              src={firstItem.product.thumbnailUrl}
              alt={firstItem.productName}
              fill
              sizes="(max-width: 1023px) 80px, 72px"
              className="object-cover"
            />
          </Link>
        ) : (
          <div className="row-span-3 aspect-square rounded-sm bg-zinc-100 lg:row-span-2" />
        )}

        <Link
          href={order.orderHref}
          className="col-start-2 row-start-1 min-w-0 text-sm font-black text-black outline-none hover:underline focus-visible:underline"
        >
          {order.productSummary}
        </Link>

        <p className="col-start-2 row-start-2 text-xs font-bold text-zinc-500">
          {order.statusDescription}
        </p>

        <p className="col-start-2 row-start-3 justify-self-start whitespace-nowrap text-sm font-black tabular-nums text-black lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:justify-self-end lg:self-center">
          {order.totalAmountText}
        </p>
      </div>

      <div className="flex justify-end lg:w-52">
        <MypageHomeOrderActions
          actions={order.actions}
          orderTitle={order.productSummary}
        />
      </div>
    </article>
  );
}
