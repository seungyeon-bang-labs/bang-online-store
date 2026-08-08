import Link from 'next/link';
import Image from 'next/image';
import { Heart, X } from 'lucide-react';
import type { ProductCardViewModel } from '@/domains/product';
import { ProductPrice } from '@/features/product/product-price';
import { cn } from '@/shared/lib/utils';

interface ProductItemProps {
  product: ProductCardViewModel;
  isWishlisted?: boolean;
  showWishlistButton?: boolean;
  wishlistButtonVariant?: 'heart' | 'remove';
  rank?: number;
  size?: 'default' | 'compact';
}

export function ProductItem({
  product,
  isWishlisted = false,
  showWishlistButton = true,
  wishlistButtonVariant = 'heart',
  rank,
  size = 'default',
}: ProductItemProps) {
  const isCompact = size === 'compact';
  const hasTopControls = rank !== undefined || showWishlistButton;

  return (
    <div className="group isolate flex flex-col rounded-lg">
      <div
        className={cn(
          'relative',
          hasTopControls && (isCompact ? 'pt-3' : 'pt-4'),
        )}
      >
        {hasTopControls ? (
          <div className="absolute inset-x-0 top-1 z-20 flex items-center justify-between sm:top-1.5">
            {rank !== undefined ? (
              <span className="rounded bg-black px-2 py-1 text-xs font-bold text-white mx-2">
                {rank}
              </span>
            ) : (
              <span aria-hidden="true" />
            )}

            {showWishlistButton ? (
              <button
                type="button"
                className={cn(
                  'inline-flex items-center justify-center transition-colors',
                  isCompact ? 'size-7' : 'size-8',
                  wishlistButtonVariant === 'remove' &&
                    'text-zinc-400 hover:text-black',
                )}
                aria-label={
                  wishlistButtonVariant === 'remove'
                    ? `${product.name} 관심 상품에서 제거`
                    : isWishlisted
                      ? '관심 상품 해제'
                      : '관심 상품 등록'
                }
              >
                {wishlistButtonVariant === 'remove' ? (
                  <X
                    size={20}
                    className={cn(product.isSoldOut && 'text-white')}
                    aria-hidden="true"
                  />
                ) : (
                  <Heart
                    size={20}
                    className={cn(
                      product.isSoldOut
                        ? 'fill-white stroke-white hover:fill-white hover:stroke-white'
                        : isWishlisted
                          ? 'fill-red-500 stroke-red-500 hover:fill-white hover:stroke-gray-400'
                          : 'text-gray-400 hover:fill-red-500 hover:stroke-red-500',
                    )}
                  />
                )}
              </button>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>
        ) : null}

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
            <span className="rounded-xs border border-white px-3 py-1 text-sm font-bold tracking-widest text-white">
              일시품절
            </span>
          </div>
        ) : null}
      </div>

      <Link href={product.href} className="flex cursor-pointer flex-col">
        <div
          className={cn(
            'flex flex-col text-left',
            isCompact ? 'gap-1 p-1.5 sm:gap-1.5 sm:p-3' : 'gap-1.5 p-3',
          )}
        >
          <h3
            className={cn(
              'line-clamp-2 font-medium tracking-tight',
              isCompact ? 'text-xs sm:text-sm' : 'text-sm',
              product.isSoldOut ? 'text-gray-400' : 'text-gray-900',
            )}
          >
            {product.name}
          </h3>
          <ProductPrice
            price={product.price}
            discount={product.discountRate}
            isOutOfStock={product.isSoldOut}
            size={isCompact ? 'compact' : 'md'}
            className={isCompact ? '[&>div]:flex-wrap' : undefined}
          />
        </div>
      </Link>
    </div>
  );
}
