import type { OrderCancellationPreviewViewModel } from '@/domains/order/cancellation';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';

interface MypageOrderCancellationProductSummaryProps {
  item: OrderCancellationPreviewViewModel['item'];
}

export function MypageOrderCancellationProductSummary({
  item,
}: MypageOrderCancellationProductSummaryProps) {
  return (
    <section className="border-t border-zinc-300 p-4 md:p-5" aria-label="주문 상품">
      <MypageProductSummary
        thumbnail={
          <MypageProductThumbnailLink
            href={item.product.href}
            src={item.product.thumbnailUrl}
            alt={item.productName}
          />
        }
        name={item.productName}
        nameHref={item.product.href}
        meta={`${item.optionLabel} · ${item.quantity}개`}
        amount={item.lineTotalText}
      />
    </section>
  );
}
