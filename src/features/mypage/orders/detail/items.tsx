import type { OrderDetailItemViewModel } from '@/domains/order';
import { MypageCard, MypageCardContentBlock } from '@/features/mypage/common';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';
import { MypageOrderItemActions } from '../order-item-actions';

interface MypageOrderDetailItemsProps {
  items: readonly OrderDetailItemViewModel[];
  orderId: string;
}

export function MypageOrderDetailItems({
  items,
  orderId,
}: MypageOrderDetailItemsProps) {
  return (
    <MypageCard.Collapsible
      title="주문 상품"
      mobileLayout="full-bleed"
      right={
        <p className="text-sm font-bold text-zinc-500">총 {items.length}개</p>
      }
    >
      <div className="divide-y divide-zinc-200">
        {items.map(item => (
          <MypageOrderDetailItem key={item.id} item={item} orderId={orderId} />
        ))}
      </div>
    </MypageCard.Collapsible>
  );
}

interface MypageOrderDetailItemProps {
  item: OrderDetailItemViewModel;
  orderId: string;
}

function MypageOrderDetailItem({ item, orderId }: MypageOrderDetailItemProps) {
  return (
    <div className="p-4 md:p-5">
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
      {item.cancellation ? (
        <MypageCardContentBlock
          title="취소 사유"
          variant="inline"
          className="mt-4"
          right={
            <div className="flex items-baseline gap-1.5 whitespace-nowrap">
              <span className="text-xs font-medium text-zinc-500">
                {item.cancellation.refundAmountLabel}
              </span>
              <span className="text-sm font-black text-red-700">
                {item.cancellation.refundAmountText}
              </span>
            </div>
          }
        >
          {item.cancellation.reasonDetail ?? item.cancellation.reason}
        </MypageCardContentBlock>
      ) : null}
      {item.actions ? (
        <div className="mt-4">
          <MypageOrderItemActions
            actions={item.actions}
            productName={item.productName}
            orderId={orderId}
            orderItemId={item.id}
            repurchaseItem={item.repurchaseItem}
          />
        </div>
      ) : null}
    </div>
  );
}
