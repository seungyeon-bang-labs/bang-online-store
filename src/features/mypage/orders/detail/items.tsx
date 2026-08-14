import Image from 'next/image';
import Link from 'next/link';
import type { OrderDetailItemViewModel } from '@/domains/order';
import { MypageOrderItemActions } from '../order-item-actions';

interface MypageOrderDetailItemsProps {
  items: readonly OrderDetailItemViewModel[];
  orderId: string;
}

export function MypageOrderDetailItems({
  items,
  orderId,
}: MypageOrderDetailItemsProps) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-200 p-4 md:p-5">
        <h3 className="font-black text-black">주문 상품</h3>
        <p className="text-sm font-bold text-zinc-500">총 {items.length}개</p>
      </header>
      <div className="divide-y divide-zinc-200">
        {items.map(item => (
          <MypageOrderDetailItem key={item.id} item={item} orderId={orderId} />
        ))}
      </div>
    </section>
  );
}

interface MypageOrderDetailItemProps {
  item: OrderDetailItemViewModel;
  orderId: string;
}

function MypageOrderDetailItem({ item, orderId }: MypageOrderDetailItemProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)] md:p-5">
      <Link
        href={item.product.href}
        className="relative row-span-3 aspect-square overflow-hidden rounded-sm bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <Image
          src={item.product.thumbnailUrl}
          alt={item.productName}
          fill
          sizes="(max-width: 640px) 72px, 88px"
          className="object-cover transition-opacity hover:opacity-80"
        />
      </Link>
      <Link
        href={item.product.href}
        className="min-w-0 font-black text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        {item.productName}
      </Link>
      <p className="mt-0.5 text-sm font-medium text-zinc-500">
        {item.optionLabel} · {item.quantity}개
      </p>
      <p
        className={`mt-1 justify-self-end font-black ${
          item.cancellation ? 'text-red-700' : 'text-black'
        }`}
      >
        {item.cancellation
          ? `환불 금액 ${item.cancellation.refundAmountText}`
          : item.lineTotalText}
      </p>
      {item.actions ? (
        <div className="col-span-2 mt-4">
          <MypageOrderItemActions
            actions={item.actions}
            productName={item.productName}
            orderId={orderId}
            orderItemId={item.id}
            repurchaseItem={item.repurchaseItem}
          />
        </div>
      ) : null}
    </div>
  );
}
