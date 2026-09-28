import Image from 'next/image';
import type { OrderItemViewModel } from '@/domains/order';
import { MypageCardContentBlock } from '@/features/mypage/common';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';
import { MypageOrderItemActions } from './order-item-actions';

interface MypageOrderCardItemsProps {
  orderId: string;
  items: OrderItemViewModel[];
}

export function MypageOrderCardItems({
  orderId,
  items,
}: MypageOrderCardItemsProps) {
  return (
    <div className="divide-y divide-zinc-200">
      {items.map(item => (
        <MypageOrderCardProductItem
          key={item.id}
          item={item}
          orderId={orderId}
        />
      ))}
    </div>
  );
}

interface MypageOrderCardCollapsedItemSummaryProps {
  item: OrderItemViewModel;
  extraItemCount: number;
  onExpand: () => void;
}

export function MypageOrderCardCollapsedItemSummary({
  item,
  extraItemCount,
  onExpand,
}: MypageOrderCardCollapsedItemSummaryProps) {
  const itemCount = extraItemCount + 1;

  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] grid-rows-[72px_auto] gap-x-4 sm:grid-cols-[88px_minmax(0,1fr)] sm:grid-rows-[88px_auto]">
      <button
        type="button"
        className="relative row-span-1 aspect-square overflow-hidden rounded-sm bg-zinc-100 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        aria-label={`상품 ${itemCount}개 펼쳐 보기`}
        aria-expanded={false}
        onClick={onExpand}
      >
        <Image
          src={item.product.thumbnailUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 72px, 88px"
          className="object-cover transition-opacity hover:opacity-80"
        />
      </button>
      <div className="col-start-2 min-w-0 self-start">
        <button
          type="button"
          className="text-left text-sm leading-5 font-black text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black md:text-base md:leading-6"
          aria-expanded={false}
          onClick={onExpand}
        >
          {item.productName} 외 {extraItemCount}개
        </button>
      </div>
    </div>
  );
}

interface MypageOrderCardProductItemProps {
  item: OrderItemViewModel;
  orderId: string;
}

function MypageOrderCardProductItem({
  item,
  orderId,
}: MypageOrderCardProductItemProps) {
  return (
    <div className="py-4 first:pt-0 last:pb-0 md:py-5">
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
      ) : item.actions ? (
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
