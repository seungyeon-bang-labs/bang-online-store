import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { InquiryContextViewModel } from '@/domains/inquiry';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';
import { getMypageOrderDetailHref } from '@/shared/lib/mypage-routes';

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
        action={
          context.kind === 'order' ? (
            <Link
              href={getMypageOrderDetailHref(context.orderId)}
              className="mt-1 inline-flex w-fit items-center gap-0.5 text-xs font-bold text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              주문 상세 보기
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : undefined
        }
      />
    </section>
  );
}
