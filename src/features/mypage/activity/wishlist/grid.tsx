import type { ActivityProductViewModel } from '@/domains/activity';
import { MypageCard } from '@/features/mypage/common';
import { ProductItem } from '@/features/product/product-item';

interface WishlistProductGridProps {
  items: readonly ActivityProductViewModel[];
}

export function WishlistProductGrid({ items }: WishlistProductGridProps) {
  return (
    <MypageCard mobileLayout="full-bleed">
      <MypageCard.Body className="px-4 py-3 md:p-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {items.map(item => (
            <ProductItem
              key={item.id}
              product={item.product}
              isWishlisted
            />
          ))}
        </div>
      </MypageCard.Body>
    </MypageCard>
  );
}
