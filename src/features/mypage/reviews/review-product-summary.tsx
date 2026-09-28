import type { ProductCardViewModel } from '@/domains/product';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';

interface ReviewProductSummaryProps {
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
}

export function ReviewProductSummary({
  product,
  productName,
  optionLabel,
}: ReviewProductSummaryProps) {
  return (
    <MypageProductSummary
      className="p-4 md:p-5"
      size="compact"
      thumbnail={
        <MypageProductThumbnailLink
          href={product.href}
          src={product.thumbnailUrl}
          alt={productName}
          size="compact"
        />
      }
      name={productName}
      nameHref={product.href}
      meta={optionLabel}
      truncateName
    />
  );
}
