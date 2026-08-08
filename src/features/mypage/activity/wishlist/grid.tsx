import type { ActivityProductViewModel } from '@/domains/activity';
import { ProductItem } from '@/features/product/product-item';

interface WishlistProductGridProps {
  items: readonly ActivityProductViewModel[];
}

export function WishlistProductGrid({ items }: WishlistProductGridProps) {
  return (
    <div className="rounded-md border border-zinc-300 bg-white p-3 md:p-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {items.map(item => (
          <ProductItem
            key={item.id}
            product={item.product}
            isWishlisted
            wishlistButtonVariant="remove"
          />
        ))}
      </div>
    </div>
  );
}
