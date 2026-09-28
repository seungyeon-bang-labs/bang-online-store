import type { OrderClaimRequestViewModel } from '@/domains/order/claim/view-model';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';

type ClaimRequestProductSummary = Pick<
  OrderClaimRequestViewModel,
  'itemAmountText' | 'optionLabel' | 'product' | 'productName' | 'quantity'
>;

interface MypageClaimRequestProductSummaryProps {
  claimRequest: ClaimRequestProductSummary;
}

export function MypageClaimRequestProductSummary({
  claimRequest,
}: MypageClaimRequestProductSummaryProps) {
  return (
    <section
      className="border-t border-zinc-300 p-4 md:p-5"
      aria-labelledby="claim-request-product-title"
    >
      <h2 id="claim-request-product-title" className="sr-only">
        교환·반품 신청 상품
      </h2>
      <MypageProductSummary
        thumbnail={
          <MypageProductThumbnailLink
            href={claimRequest.product.href}
            src={claimRequest.product.thumbnailUrl}
            alt={claimRequest.productName}
          />
        }
        name={claimRequest.productName}
        nameHref={claimRequest.product.href}
        meta={`${claimRequest.optionLabel} · ${claimRequest.quantity}개`}
        amount={claimRequest.itemAmountText}
        truncateName
      />
    </section>
  );
}
