import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import type { ProductCardViewModel } from '@/domains/product';
import { ProductPrice } from '@/features/product/product-price';
import { cn } from '@/shared/lib/utils';

interface ProductItemProps {
  product: ProductCardViewModel;
  isWishlisted?: boolean;
  showWishlistButton?: boolean;
  rank?: number;
}

export function ProductItem({
  product,
  isWishlisted = false,
  showWishlistButton = true,
  rank,
}: ProductItemProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg">
      <Link href={product.href} className="flex cursor-pointer flex-col">
        {/* 이미지 영역 */}
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
            className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />

          {/* 일시품절 라벨 (있을 경우) */}
          {product.isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 ">
              <span className="text-white font-bold text-sm border border-white px-3 py-1 tracking-widest rounded-xs">
                일시품절
              </span>
            </div>
          )}

          {/* 랭킹 배지 (rank이 있을 때만) */}
          {rank !== undefined && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-black text-white font-bold text-xs rounded">
              {rank}
            </div>
          )}
        </div>

        <div className="flex flex-col p-3 text-left gap-1.5">
          <h3
            className={cn(
              'text-sm font-medium  line-clamp-2 tracking-tight',
              product.isSoldOut ? 'text-gray-400' : 'text-gray-900',
            )}
          >
            {product.name}
          </h3>
          <ProductPrice
            price={product.price}
            discount={product.discountRate}
            isOutOfStock={product.isSoldOut}
            size="md"
          />
        </div>
      </Link>

      {/* 우측 상단 관심 상품 아이콘 버튼 */}
      {showWishlistButton ? (
        <button
          type="button"
          className="absolute right-1 top-1 cursor-pointer p-1.5 backdrop-blur-sm transition-colors"
          aria-label={isWishlisted ? '관심 상품 해제' : '관심 상품 등록'}
        >
          <Heart
            size={20}
            className={cn(
              isWishlisted
                ? 'fill-red-500 stroke-red-500 hover:fill-white hover:stroke-gray-400'
                : 'text-gray-400 hover:fill-red-500 hover:stroke-red-500',
              product.isSoldOut && 'text-gray-200',
            )}
          />
        </button>
      ) : null}
    </div>
  );
}
