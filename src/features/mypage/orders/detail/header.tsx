import type { OrderDetailViewModel } from '@/domains/order';
import { Button } from '@/components/ui/button';

interface MypageOrderDetailHeaderProps {
  order: Pick<OrderDetailViewModel, 'orderNumber' | 'orderedAt'>;
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="mt-4 h-9 w-full rounded-sm border-zinc-300 font-bold shadow-none disabled:opacity-100"
          >
            영수증
          </Button>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="shrink-0 rounded-sm border-zinc-300 font-bold shadow-none disabled:opacity-100"
          >
            영수증
          </Button>
        </div>
      </div>
    </section>
  );
}
