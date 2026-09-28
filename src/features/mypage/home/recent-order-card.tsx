import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import type { MypageHomeRecentOrderViewModel } from '@/domains/mypage';
import { MypageBadge } from '../common/badge';
import { MypageProductThumbnailLink } from '../common/product-summary';
import { MypageHomeOrderActions } from './order-actions';

interface MypageHomeRecentOrderCardProps {
  order: MypageHomeRecentOrderViewModel;
  className?: string;
}

export function MypageHomeRecentOrderCard({
  order,
  className,
}: MypageHomeRecentOrderCardProps) {
  const firstItem = order.items[0];
  const extraItemCount = Math.max(order.items.length - 1, 0);
  const displayProductName = firstItem?.productName ?? order.productSummary;

  return (
    <article className={cn('p-4 md:p-5', className)}>
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-1 sm:grid-cols-[88px_minmax(0,1fr)] lg:hidden">
        {firstItem ? (
          <MypageProductThumbnailLink
            href={order.orderHref}
            src={firstItem.product.thumbnailUrl}
            alt={firstItem.productName}
            size="default"
            loading="eager"
            className="row-span-4 self-center"
            ariaLabel={`${order.productSummary} 주문 조회`}
          />
        ) : (
          <div className="row-span-4 aspect-square self-center rounded-sm bg-zinc-100" />
        )}

        <div className="col-start-2 row-start-1 w-fit">
          <MypageBadge {...order.status} />
        </div>

        <Link
          href={order.orderHref}
          aria-label={order.productSummary}
          title={order.productSummary}
          className="col-start-2 row-start-2 flex min-w-0 items-center gap-0.5 text-sm font-bold text-black outline-none hover:underline focus-visible:underline md:font-black"
        >
          <span className="min-w-0 truncate">{displayProductName}</span>
          {extraItemCount > 0 ? (
            <span className="shrink-0 whitespace-nowrap">
              외 {extraItemCount}건
            </span>
          ) : null}
        </Link>

        <p className="col-start-2 row-start-3 text-xs font-medium md:font-bold text-zinc-500">
          {order.statusDescription}
        </p>

        <p className="col-start-2 row-start-4 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm tabular-nums">
          <span className="text-xs font-medium text-zinc-500">
            {order.orderAmount.label}
          </span>
          <span className="font-black text-black">{order.orderAmount.amountText}</span>
        </p>
      </div>

      <div className="mt-4 flex lg:hidden">
        <MypageHomeOrderActions
          actions={order.actions}
          orderTitle={order.productSummary}
        />
      </div>

      <div className="hidden lg:grid lg:grid-cols-[72px_minmax(0,1fr)_auto_auto] lg:items-start lg:gap-x-4">
        {firstItem ? (
          <MypageProductThumbnailLink
            href={order.orderHref}
            src={firstItem.product.thumbnailUrl}
            alt={firstItem.productName}
            size="home"
            loading="eager"
            className="self-start"
            ariaLabel={`${order.productSummary} 주문 조회`}
          />
        ) : (
          <div className="aspect-square rounded-sm bg-zinc-100" />
        )}

        <div className="min-w-0 self-start">
          <div className="w-fit">
            <MypageBadge {...order.status} />
          </div>
          <Link
            href={order.orderHref}
            className="mt-1 block min-w-0 text-sm font-black text-black outline-none hover:underline focus-visible:underline"
          >
            {order.productSummary}
          </Link>
          <p className="mt-0.5 text-xs font-bold text-zinc-500">
            {order.statusDescription}
          </p>
        </div>

        <p className="self-center justify-self-end whitespace-nowrap text-right tabular-nums">
          <span className="block text-xs font-medium text-zinc-500">
            {order.orderAmount.label}
          </span>
          <span className="mt-0.5 block text-sm font-black text-black">
            {order.orderAmount.amountText}
          </span>
        </p>

        <div className="self-center justify-self-end">
          <MypageHomeOrderActions
            actions={order.actions}
            orderTitle={order.productSummary}
          />
        </div>
      </div>
    </article>
  );
}
