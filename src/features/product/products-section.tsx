'use client';

import { type ReactNode, useState } from 'react';
import { toProductCardViewModel } from '@/domains/product';
import { ProductItem } from '@/features/product/product-item';
import { type Product } from '@/lib/products-data';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ProductsSectionProps {
  title: ReactNode;
  items: Product[];
}

export function ProductsSection({ title, items }: ProductsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const LIMIT = 5;
  const hasMore = items.length > LIMIT;
  const visibleItems = isExpanded ? items : items.slice(0, LIMIT);

  return (
    <section className="bg-white px-8 py-6 shadow-sm rounded-md">
      <h2 className="text-lg font-bold border-l-4 border-black pl-3 mb-8 flex items-center gap-3">
        {title}
        <span className="text-sm font-normal text-gray-400 ml-auto">
          총 {items.length}개 제품
        </span>
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {visibleItems.map(product => (
          <ProductItem
            key={product.id}
            product={toProductCardViewModel(product)}
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
              : `${items.length - LIMIT}개 제품 더보기`}
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      )}
    </section>
  );
}
