'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OrderItemViewModel, OrderRefundViewModel } from '@/domains/order';
import { MypageOrderItemActions } from './item-actions';
import { MypageOrderCardPaymentSummary } from './card-payment-summary';

interface MypageOrderCardItemsProps {
  items: OrderItemViewModel[];
  finalAmountText: string;
  refunds: OrderRefundViewModel[];
}

export function MypageOrderCardItems({
  items,
  finalAmountText,
  refunds,
}: MypageOrderCardItemsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const extraItemCount = items.length - 1;
  const hasMultipleItems = extraItemCount > 0;
  const isCollapsed = hasMultipleItems && !isExpanded;

  return (
    <>
      <div className="divide-y divide-zinc-100">
        {isCollapsed ? (
          <MypageOrderCardCollapsedItemSummary
            item={items[0]}
            extraItemCount={extraItemCount}
            finalAmountText={finalAmountText}
            onExpand={() => setIsExpanded(true)}
          />
        ) : (
          items.map(item => (
            <MypageOrderCardProductItem key={item.id} item={item} />
          ))
        )}
      </div>

      {hasMultipleItems && isExpanded && (
        <MypageOrderCardPaymentSummary
          finalAmountText={finalAmountText}
          refunds={refunds}
        />
      )}

      {hasMultipleItems && isExpanded && (
        <div className="border-t border-zinc-100 p-4 md:px-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
            onClick={() => setIsExpanded(false)}
          >
            상품 접기
            <ChevronUp className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )}
    </>
  );
}

interface MypageOrderCardCollapsedItemSummaryProps {
  item: OrderItemViewModel;
  extraItemCount: number;
  finalAmountText: string;
  onExpand: () => void;
}

function MypageOrderCardCollapsedItemSummary({
  item,
  extraItemCount,
  finalAmountText,
  onExpand,
}: MypageOrderCardCollapsedItemSummaryProps) {
  const itemCount = extraItemCount + 1;

  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] grid-rows-[72px_auto] gap-x-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)] sm:grid-rows-[88px_auto] md:p-5">
      <button
        type="button"
        className="relative row-span-1 aspect-square overflow-hidden rounded-sm bg-zinc-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
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
      <div className="col-start-2 flex h-full min-w-0 flex-col justify-between">
        <button
          type="button"
          className="text-left font-black text-black hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          aria-expanded={false}
          onClick={onExpand}
        >
          {item.productName} 외 {extraItemCount}개
        </button>
        <p className="self-end font-black text-black">총 {finalAmountText}</p>
      </div>
      <div className="col-span-2 mt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
          onClick={onExpand}
        >
          총 상품 {itemCount}개 더보기
          <ChevronDown className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

interface MypageOrderCardProductItemProps {
  item: OrderItemViewModel;
}

function MypageOrderCardProductItem({ item }: MypageOrderCardProductItemProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] grid-rows-[auto_auto_auto] gap-x-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)] md:p-5">
      <Link
        href={item.product.href}
        className="relative row-span-3 aspect-square overflow-hidden rounded-sm bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <Image
          src={item.product.thumbnailUrl}
          alt={item.productName}
          fill
          sizes="(max-width: 640px) 72px, 88px"
          className="object-cover transition-opacity hover:opacity-80"
        />
      </Link>
      <div className="col-start-2 row-start-1 flex min-w-0 items-start gap-2">
        <Link
          href={item.product.href}
          className="min-w-0 flex-1 font-black text-black hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {item.productName}
        </Link>
      </div>
      <p className="col-start-2 row-start-2 mt-0.5 text-sm font-medium text-zinc-500">
        {item.optionLabel} · {item.quantity}개
      </p>
      <p
        className={`col-start-2 row-start-3 mt-1 justify-self-end font-black ${
          item.cancellation ? 'text-red-700' : 'text-black'
        }`}
      >
        {item.cancellation
          ? `환불 금액 ${item.cancellation.refundAmountText}`
          : item.lineTotalText}
      </p>
      {!item.cancellation && item.actions ? (
        <div className="col-span-2 mt-2">
          <MypageOrderItemActions
            actions={item.actions}
            productName={item.productName}
          />
        </div>
      ) : null}
    </div>
  );
}
