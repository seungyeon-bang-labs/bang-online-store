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
  const { listRef, canScrollLeft, canScrollRight } =
    useOrderStatusScrollIndicators(items.length);

  return (
    <nav aria-label="최근 3개월 주문 상태" className="relative">
      <ul
        ref={listRef}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-md border border-zinc-200 bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible"
      >
        {items.map(item => (
          <MypageHomeOrderStatusLink key={item.status} item={item} />
        ))}
      </ul>

      <MypageHomeOrderStatusScrollHint side="left" visible={canScrollLeft} />
      <MypageHomeOrderStatusScrollHint side="right" visible={canScrollRight} />
    </nav>
  );
}

interface MypageHomeOrderStatusLinkProps {
  item: MypageHomeOrderStatusViewModel;
}

function MypageHomeOrderStatusLink({ item }: MypageHomeOrderStatusLinkProps) {
  return (
    <li className="min-w-26 shrink-0 snap-start border-r border-zinc-200 last:border-r-0 lg:min-w-0">
      <Link
        href={buildQueryHref('/mypage/orders', {
          period: '3-months',
          status: item.status,
          page: 1,
        })}
        aria-label={`${item.label} 주문 ${item.count}건 보기`}
        className="group flex h-24 flex-col items-center justify-center px-2 text-center outline-none transition-colors hover:bg-black focus-visible:bg-black"
      >
        <p
          className={cn(
            'text-2xl font-black transition-colors group-hover:text-white group-focus-visible:text-white',
            item.count > 0 ? 'text-black' : 'text-zinc-300',
          )}
        >
          {item.count}
        </p>
        <p className="mt-2 whitespace-nowrap text-sm font-bold text-zinc-500 transition-colors group-hover:text-white group-focus-visible:text-white">
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
        'pointer-events-none absolute inset-y-px z-10 flex w-10 items-center lg:hidden',
        isLeft
          ? 'left-px justify-start rounded-l-md bg-linear-to-r from-white via-white/90 to-transparent pl-1'
          : 'right-px justify-end rounded-r-md bg-linear-to-l from-white via-white/90 to-transparent pr-1',
      )}
    >
      <Icon className="size-4 text-zinc-500" />
    </div>
  );
}
