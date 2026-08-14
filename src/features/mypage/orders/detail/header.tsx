import Link from 'next/link';
import type { OrderDetailViewModel } from '@/domains/order';
import { Button } from '@/components/ui/button';
import { getMypageOrderReceiptHref } from '@/shared/lib/mypage-routes';

interface MypageOrderDetailHeaderProps {
  order: Pick<OrderDetailViewModel, 'id' | 'orderNumber' | 'orderedAt' | 'paidAt'>;
}

export function MypageOrderDetailHeader({
  order,
}: MypageOrderDetailHeaderProps) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <div className="p-4 md:p-5">
        <div className="md:hidden">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-zinc-500">주문한 날짜</dt>
              <dd className="mt-1 font-bold text-black">{order.orderedAt}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500">주문 번호</dt>
              <dd className="mt-1 break-all font-black text-black">
                {order.orderNumber}
              </dd>
            </div>
          </dl>
          <ReceiptLinkButton order={order} className="mt-4 h-9 w-full" />
        </div>
        <div className="hidden items-center justify-between gap-4 md:flex">
          <dl className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
            <dt className="font-medium text-zinc-500">주문한 날짜</dt>
            <dd className="font-bold text-black">{order.orderedAt}</dd>
            <dt className="font-medium text-zinc-500">주문 번호</dt>
            <dd className="truncate font-black text-black">
              {order.orderNumber}
            </dd>
          </dl>
          <ReceiptLinkButton order={order} className="shrink-0" />
        </div>
      </div>
    </section>
  );
}

interface ReceiptLinkButtonProps {
  order: Pick<OrderDetailViewModel, 'id' | 'paidAt'>;
  className?: string;
}

function ReceiptLinkButton({ order, className }: ReceiptLinkButtonProps) {
  const buttonClassName = `rounded-sm border-zinc-300 font-bold shadow-none ${className ?? ''}`;

  if (!order.paidAt) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        className={`${buttonClassName} disabled:opacity-100`}
      >
        영수증
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild className={buttonClassName}>
      <Link href={getMypageOrderReceiptHref(order.id)}>영수증</Link>
    </Button>
  );
}
