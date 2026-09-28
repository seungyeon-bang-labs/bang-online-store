'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { MypageHomeOrderStatusViewModel } from '@/domains/mypage';
import { buildQueryHref } from '@/shared/lib/query';
import { cn } from '@/shared/lib/utils';
import { useOrderStatusScrollIndicators } from './hooks/use-order-status-scroll-indicators';

interface MypageHomeOrderStatusesProps {
  items: MypageHomeOrderStatusViewModel[];
}

export function MypageHomeOrderStatuses({
  items,
}: MypageHomeOrderStatusesProps) {
  const mobileItems = items.filter(item => item.status !== 'cancelled');
  const { listRef, canScrollLeft, canScrollRight } =
    useOrderStatusScrollIndicators(items.length);

  return (
    <nav aria-label="최근 1개월 주문 상태" className="relative">
      <ul
        ref={listRef}
        className="grid grid-cols-4 rounded-md border border-zinc-200 bg-white md:flex md:snap-x md:snap-mandatory md:overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible"
      >
        {items.map(item => (
          <MypageHomeOrderStatusLink
            key={item.status}
            item={item}
            isLastOnMobile={
              mobileItems.at(-1)?.status === item.status
            }
          />
        ))}
      </ul>

      <MypageHomeOrderStatusScrollHint side="left" visible={canScrollLeft} />
      <MypageHomeOrderStatusScrollHint side="right" visible={canScrollRight} />
    </nav>
  );
}

interface MypageHomeOrderStatusLinkProps {
  item: MypageHomeOrderStatusViewModel;
  isLastOnMobile: boolean;
}

function MypageHomeOrderStatusLink({
  item,
  isLastOnMobile,
}: MypageHomeOrderStatusLinkProps) {
  return (
    <li
      className={cn(
        'min-w-0 shrink-0 snap-start border-r border-zinc-200 md:min-w-26 lg:min-w-0',
        item.status === 'cancelled' && 'hidden md:list-item',
        isLastOnMobile && 'border-r-0 md:border-r',
        'last:border-r-0',
      )}
    >
      <Link
        href={buildQueryHref('/mypage/orders', {
          period: '1-month',
          status: item.status,
          page: 1,
        })}
        aria-label={`${item.label} 주문 ${item.count}건 보기`}
        className="group flex aspect-square h-auto flex-col items-center justify-center px-1 text-center outline-none transition-colors hover:bg-zinc-50 focus-visible:bg-zinc-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black md:aspect-auto md:h-24 md:px-2"
      >
        <p
          className={cn(
            'text-xl font-bold md:text-2xl md:font-black',
            item.count > 0 ? 'text-black' : 'text-zinc-300',
          )}
        >
          {item.count}
        </p>
        <p className="mt-1 whitespace-nowrap text-xs font-medium md:mt-2 md:text-sm md:font-bold text-zinc-500 transition-colors group-hover:text-black group-focus-visible:text-black">
          {item.label}
        </p>
      </Link>
    </li>
  );
}

interface MypageHomeOrderStatusScrollHintProps {
  side: 'left' | 'right';
  visible: boolean;
}

function MypageHomeOrderStatusScrollHint({
  side,
  visible,
}: MypageHomeOrderStatusScrollHintProps) {
  if (!visible) return null;

  const isLeft = side === 'left';
  const Icon = isLeft ? ChevronLeft : ChevronRight;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-y-px z-10 hidden w-10 items-center md:flex lg:hidden',
        isLeft
          ? 'left-px justify-start rounded-l-md bg-linear-to-r from-white via-white/90 to-transparent pl-1'
          : 'right-px justify-end rounded-r-md bg-linear-to-l from-white via-white/90 to-transparent pr-1',
      )}
    >
      <Icon className="size-4 text-zinc-500" />
    </div>
  );
}
