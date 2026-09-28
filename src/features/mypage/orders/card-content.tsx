'use client';

import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import type { OrderAmountViewModel, OrderItemViewModel } from '@/domains/order';
import { MypageAmountRow, MypageCard } from '@/features/mypage/common';
import {
  MypageOrderCardCollapsedItemSummary,
  MypageOrderCardItems,
} from './card-items';

interface MypageOrderCardContentProps {
  orderAmount: OrderAmountViewModel;
  items: OrderItemViewModel[];
  orderId: string;
}

export function MypageOrderCardContent({
  orderAmount,
  items,
  orderId,
}: MypageOrderCardContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const extraItemCount = items.length - 1;
  const hasMultipleItems = extraItemCount > 0;
  const isCollapsed = hasMultipleItems && !isExpanded;

  return (
    <MypageCard.Body>
      {isCollapsed ? (
        <div className="divide-y divide-zinc-100">
          <MypageOrderCardCollapsedItemSummary
            item={items[0]}
            extraItemCount={extraItemCount}
            onExpand={() => setIsExpanded(true)}
          />
        </div>
      ) : (
        <MypageOrderCardItems items={items} orderId={orderId} />
      )}

      {hasMultipleItems && (
        <div className="mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`w-full ${MYPAGE_ACTION_CLASS_NAME.outline}`}
            onClick={() => setIsExpanded(current => !current)}
          >
            {isExpanded ? '상품 접기' : `총 상품 ${items.length}개 펼치기`}
            {isExpanded ? (
              <ChevronUp className="size-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      )}

      <div className="mt-4 -mx-4 border-t border-zinc-200 px-4 pt-4 md:-mx-5 md:px-5">
        <MypageAmountRow
          label={orderAmount.label}
          value={orderAmount.amountText}
          tone="total"
        />
      </div>
    </MypageCard.Body>
  );
}
