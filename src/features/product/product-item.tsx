import Link from 'next/link';
import Image from 'next/image';
import type { ProductCardViewModel } from '@/domains/product';
import { ProductPrice } from '@/features/product/product-price';
import { cn } from '@/shared/lib/utils';
import { ProductWishlistButton } from './product-wishlist-button';

interface ProductItemProps {
  product: ProductCardViewModel;
  isWishlisted?: boolean;
  rank?: number;
}

export function ProductItem({
  product,
  isWishlisted = false,
  rank,
}: ProductItemProps) {
  return (
    <div className="group isolate flex flex-col rounded-lg">
      <div className="relative">
        <Link href={product.href} className="block cursor-pointer">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={product.thumbnailUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>

        {product.isSoldOut ? (
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-center justify-center rounded-lg bg-black/30 top-0',
            )}
          >
          <span className="rounded-xs border border-white px-3 py-1 text-xs font-bold tracking-widest text-white md:text-sm">
              일시품절
            </span>
          </div>
        ) : null}

        {rank !== undefined ? (
          <span className="absolute left-1.5 top-1.5 z-20 rounded bg-black px-1.5 py-0.5 text-[10px] font-bold text-white md:left-2 md:top-2 md:px-2 md:py-1 md:text-xs">
            {rank}
          </span>
        ) : null}
        <ProductWishlistButton
          productName={product.name}
          isWishlisted={isWishlisted}
          className="absolute right-0 top-0 z-20 size-7 md:right-1 md:top-1 md:size-8"
        />
      </div>

      <Link href={product.href} className="flex cursor-pointer flex-col">
        <div className="flex flex-col gap-1 px-1 pt-2 text-left md:px-1.5 md:pt-2">
          <h3
            className={cn(
              'line-clamp-2 font-normal tracking-tight',
              'text-[13px] md:text-[15px]',
              product.isSoldOut ? 'text-gray-400' : 'text-gray-900',
            )}
          >
            {product.name}
          </h3>
          <ProductPrice
            price={product.price}
            discount={product.discountRate}
            isOutOfStock={product.isSoldOut}
            variant="product-card"
          />
        </div>
      </Link>
    </div>
  );
}
