'use client';

import { type ReactNode, useState } from 'react';
import { ProductItem } from '@/features/product/product-item';
import type { ProductCardViewModel } from '@/domains/product';
import { Button } from '@/shared/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductsSectionProps {
  title: ReactNode;
  productCardViewModels: readonly ProductCardViewModel[];
}

export function ProductsSection({ title, productCardViewModels }: ProductsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const LIMIT = 5;
  const hasMore = productCardViewModels.length > LIMIT;
  const visibleItems = isExpanded
    ? productCardViewModels
    : productCardViewModels.slice(0, LIMIT);

  return (
    <section className="rounded-md bg-white px-4 py-5 shadow-sm md:px-8 md:py-6">
      <h2 className="mb-5 flex items-center gap-3 border-l-4 border-black pl-3 text-base font-bold md:mb-8 md:text-lg">
        {title}
        <span className="ml-auto shrink-0 whitespace-nowrap text-xs font-normal text-gray-400 md:text-sm">
          총 {productCardViewModels.length}개 제품
        </span>
      </h2>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4 lg:grid-cols-5">
        {visibleItems.map(product => (
          <ProductItem
            key={product.id}
            product={product}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={() => setIsExpanded(!isExpanded)}
            variant="outline"
            className="tracking-widest w-full gap-1"
          >
            {isExpanded
              ? '간략히 보기'
              : `${productCardViewModels.length - LIMIT}개 제품 더보기`}
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      )}
    </section>
  );
}
