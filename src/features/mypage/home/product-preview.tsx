import { Slider } from '@/shared/components/common/slider';
import type { ActivityProductViewModel } from '@/domains/activity';
import { ProductItem } from '@/features/product/product-item';

interface MypageHomeProductPreviewProps {
  items: ActivityProductViewModel[];
  ariaLabel: string;
  isWishlisted?: boolean;
}

export function MypageHomeProductPreview({
  items,
  ariaLabel,
  isWishlisted = false,
}: MypageHomeProductPreviewProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-5 py-5 md:px-6">
      <Slider
        rows={1}
        cols={5}
        slidesToScroll="auto"
        ariaLabel={ariaLabel}
        navigationPosition="edge"
        itemClassName="basis-1/2 sm:basis-1/4 lg:basis-1/5"
      >
        {items.map(item => (
          <ProductItem
            key={item.id}
            product={item.product}
            isWishlisted={isWishlisted}
          />
        ))}
      </Slider>
    </div>
  );
}
