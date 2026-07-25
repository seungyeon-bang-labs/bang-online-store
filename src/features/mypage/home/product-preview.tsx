import { Slider } from '@/components/common/slider';
import type { ActivityProductViewModel } from '@/domains/activity';
import { ProductItem } from '@/features/product/product-item';

interface MypageHomeProductPreviewProps {
  items: ActivityProductViewModel[];
  ariaLabel: string;
}

export function MypageHomeProductPreview({
  items,
  ariaLabel,
}: MypageHomeProductPreviewProps) {
  return (
    <Slider
      rows={1}
      cols={5}
      slidesToScroll="auto"
      ariaLabel={ariaLabel}
      navigationPosition="edge"
      itemClassName="basis-1/3 sm:basis-1/4 lg:basis-1/5"
    >
      {items.map(item => (
        <ProductItem
          key={item.id}
          product={item.product}
          showWishlistButton={false}
          size="compact"
        />
      ))}
    </Slider>
  );
}
