'use client';

import { Slider } from '@/components/common/slider';
import type { ActivityProductViewModel } from '@/domains/activity';
import { ProductItem } from '@/features/product/product-item';

export function MypageDashboardProductPreview({
  items,
}: {
  items: ActivityProductViewModel[];
}) {
  return (
    <Slider
      rows={1}
      cols={5}
      navigationPosition="edge"
      itemClassName="basis-1/2 sm:basis-1/3 lg:basis-1/5"
    >
      {items.map(item => (
        <ProductItem
          key={item.id}
          product={item.product}
          showWishlistButton={false}
        />
      ))}
    </Slider>
  );
}
