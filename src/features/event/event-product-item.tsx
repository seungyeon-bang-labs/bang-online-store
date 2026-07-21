import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductPrice } from '@/features/product/product-price';
import { cn } from '@/shared/lib/utils';
import type { ProductCardViewModel } from '@/domains/product';

interface EventProductItemProps {
  productCardViewModel: ProductCardViewModel;
}

export function EventProductItem({ productCardViewModel }: EventProductItemProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg">
      <Link
        href={productCardViewModel.href}
        className="flex flex-col cursor-pointer"
      >
        <div className="relative aspect-square overflow-hidden bg-gray-100 rounded-lg">
          <Image
            src={productCardViewModel.thumbnailUrl}
            alt={productCardViewModel.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />

          {productCardViewModel.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="rounded-xs border border-white px-3 py-1 text-sm font-bold tracking-widest text-white">
                일시품절
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 p-3 text-left">
          <h3
            className={cn(
              'line-clamp-2 text-sm font-medium tracking-tight',
              productCardViewModel.isSoldOut
                ? 'text-gray-400'
                : 'text-gray-900',
            )}
          >
            {productCardViewModel.name}
          </h3>
          <ProductPrice
            price={productCardViewModel.price}
            discount={productCardViewModel.discountRate}
            isOutOfStock={productCardViewModel.isSoldOut}
            size="md"
          />
        </div>
      </Link>

      <button
        className="absolute top-1 right-1 cursor-pointer p-1.5 backdrop-blur-sm transition-colors"
        aria-label="관심 상품 등록"
      >
        <Heart
          size={20}
          className={cn(
            'text-gray-400 hover:fill-red-500 hover:stroke-red-500',
            productCardViewModel.isSoldOut && 'text-gray-200',
          )}
        />
      </button>
    </div>
  );
}
