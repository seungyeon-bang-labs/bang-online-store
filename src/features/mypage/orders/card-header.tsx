import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { OrderStatus } from '@/domains/order';
import { getMypageOrderDetailHref } from '@/shared/lib/mypage-routes';
import type { StatusViewModel } from '@/shared/types/status';
import { MypageStatusBadge } from '../common/status-badge';

interface MypageOrderCardHeaderProps {
  orderId: string;
  status: StatusViewModel;
  statusCode: OrderStatus;
  statusDescription: string;
  cancelledItemCount: number;
}

export function MypageOrderCardHeader({
  orderId,
  status,
  statusCode,
  statusDescription,
  cancelledItemCount,
}: MypageOrderCardHeaderProps) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 border-b border-zinc-200 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center md:p-5">
      <div className="justify-self-start">
        <MypageStatusBadge {...status} size="large" />
      </div>
      <p className="col-span-2 pl-2.5 text-sm font-black text-black sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:pl-0">
        {statusDescription}
        {statusCode !== 'cancelled' && cancelledItemCount > 0 && (
          <span className="font-bold text-red-700">
            {' · 취소 상품 ' + cancelledItemCount + '개'}
          </span>
        )}
      </p>
      <Link
        href={getMypageOrderDetailHref(orderId)}
        className="col-start-2 row-start-1 inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-bold text-black hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:col-start-3"
      >
        주문 상세 보기
        <ChevronRight className="size-4" aria-hidden="true" />
      </Link>
    </header>
  );
}
