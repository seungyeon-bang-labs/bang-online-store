import type { InquiryContextViewModel } from '@/domains/inquiry';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';

interface MypageInquiryContextProps {
  context: InquiryContextViewModel;
}

export function MypageInquiryContext({
  context,
}: MypageInquiryContextProps) {
  const productCountSuffix =
    context.kind === 'order' && context.productCount > 1
      ? ` 외 ${context.productCount - 1}개`
      : '';
  const optionLabel =
    context.kind === 'product'
      ? context.optionLabel
      : context.representativeOptionLabel
        ? `${context.productCount > 1 ? '대표 상품 옵션 ' : ''}${context.representativeOptionLabel}`
        : undefined;

  return (
    <section>
      <MypageProductSummary
        thumbnail={
          <MypageProductThumbnailLink
            href={context.product.href}
            src={context.product.thumbnailUrl}
            alt={context.product.name}
          />
        }
        name={`${context.product.name}${productCountSuffix}`}
        nameHref={context.kind === 'product' ? context.product.href : undefined}
        meta={optionLabel}
        truncateName
      />
    </section>
  );
}
