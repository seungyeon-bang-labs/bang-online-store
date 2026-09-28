import { MypageListStack } from '@/features/mypage/common/list-stack';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { OrderListItemViewModel } from '@/domains/order';
import { MypageCard } from '@/features/mypage/common';
import { MYPAGE_LIST_CARD_HEADER_CLASS_NAME } from '@/features/mypage/common/styles';
import { getMypageOrderDetailHref } from '@/shared/lib/mypage-routes';
import { MypageBadge } from '../common/badge';
import { MypageOrderCardContent } from './card-content';

interface MypageOrderCardListProps {
  orders: OrderListItemViewModel[];
}

export function MypageOrderCardList({
  orders,
}: MypageOrderCardListProps) {
  return (
    <MypageListStack density="compact">
      {orders.map(order => (
        <MypageCard key={order.id} as="article">
          <MypageCard.Header className={MYPAGE_LIST_CARD_HEADER_CLASS_NAME}>
            <div className="justify-self-start">
              <MypageBadge {...order.status} size="responsive" />
            </div>
            <p className="col-start-1 row-start-2 min-w-0 truncate pl-2 text-xs font-bold text-zinc-700 md:col-span-1 md:col-start-2 md:row-start-1 md:pl-0 md:text-sm md:font-black md:text-black">
              {order.statusDescription}
              {order.statusCode !== 'cancelled' &&
                order.cancelledItemCount > 0 && (
                  <span className="font-bold text-red-700">
                    {' · 취소 상품 ' + order.cancelledItemCount + '개'}
                  </span>
                )}
            </p>
            <Link
              href={getMypageOrderDetailHref(order.id)}
              aria-label="주문 상세 보기"
              className="col-start-2 row-span-2 row-start-1 inline-flex min-h-10 items-center justify-self-end gap-0.5 whitespace-nowrap text-sm font-bold text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black md:col-start-3 md:row-span-1 md:min-h-0"
            >
              상세 보기
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </MypageCard.Header>
          <MypageOrderCardContent
            orderId={order.id}
            items={order.items}
            orderAmount={order.orderAmount}
          />
        </MypageCard>
      ))}
    </MypageListStack>
  );
}
