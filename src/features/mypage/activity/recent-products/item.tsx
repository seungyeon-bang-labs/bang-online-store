import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import type { ActivityProductViewModel } from '@/domains/activity';
import { ProductPrice } from '@/features/product/product-price';

interface MypageRecentProductItemProps {
  item: ActivityProductViewModel;
}

export function MypageRecentProductItem({
  item,
}: MypageRecentProductItemProps) {
  const { product } = item;

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 px-3 py-4 sm:grid-cols-[88px_minmax(0,1fr)] md:px-4 md:py-5">
      <Link
        href={product.href}
        className="relative h-18 w-18 self-start overflow-hidden rounded-sm bg-zinc-100 outline-none ring-black focus-visible:ring-2 sm:h-22 sm:w-22"
      >
        <Image
          src={product.thumbnailUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 72px, 88px"
          className="object-cover"
        />
      </Link>

      <div className="min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
          <Link
            href={product.href}
            className="block min-w-0 truncate text-base leading-tight font-black text-black outline-none hover:underline focus-visible:underline"
          >
            {product.name}
          </Link>
          <button
            type="button"
            aria-label={`${product.name} 최근 본 상품에서 제거`}
            className="inline-flex size-6 items-center justify-center rounded-sm text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:size-7"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ProductPrice
          price={product.price}
          discount={product.discountRate}
          size="md"
          className="mt-1"
        />
      </div>
    </article>
  );
}
