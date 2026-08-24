import Image from 'next/image';
import Link from 'next/link';
import type { OrderCancellationPreviewViewModel } from '@/domains/order/cancellation';

interface MypageOrderCancellationProductSummaryProps {
  item: OrderCancellationPreviewViewModel['item'];
}

export function MypageOrderCancellationProductSummary({
  item,
}: MypageOrderCancellationProductSummaryProps) {
  return (
    <section className="border-t border-zinc-300 p-4 md:p-5" aria-label="주문 상품">
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[88px_minmax(0,1fr)]">
        <Link
          href={item.product.href}
          className="relative row-span-3 aspect-square overflow-hidden rounded-sm bg-zinc-100 focus-visible:outline-offset-2 focus-visible:outline-black"
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
          className="min-w-0 font-black text-black hover:underline focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {item.productName}
        </Link>
        <p className="mt-0.5 text-sm font-medium text-zinc-500">
          {item.optionLabel} · {item.quantity}개
        </p>
        <p className="mt-1 font-black text-black">
          {item.lineTotalText}
        </p>
      </div>
    </section>
  );
}
