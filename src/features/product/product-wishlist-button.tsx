'use client';

import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

interface ProductWishlistButtonProps {
  productName: string;
  isWishlisted: boolean;
  className?: string;
}

export function ProductWishlistButton({
  productName,
  isWishlisted,
  className,
}: ProductWishlistButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        toast.success(
          isWishlisted ? '관심 상품에서 삭제했습니다.' : '관심 상품에 등록했습니다.',
          { position: 'bottom-center' },
        );
      }}
      className={cn(
        'inline-flex items-center justify-center text-black',
        className,
      )}
      aria-label={
        isWishlisted
          ? `${productName} 관심 상품 해제`
          : `${productName} 관심 상품 등록`
      }
    >
      <Heart
        strokeWidth={2.5}
        className={cn(
          'size-[18px] fill-transparent drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)] transition-[fill] md:size-5',
          isWishlisted ? 'fill-current hover:fill-transparent' : 'hover:fill-current',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
