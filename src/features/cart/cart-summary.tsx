import { Button } from '@/shared/components/ui/button';
import { useMemo, useState } from 'react';
import { ChevronUp, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { getProductLinePrice } from '@/domains/product/domain';
import { cn } from '@/shared/lib/utils';

import type { CartItemViewModel } from '@/domains/cart/view-model';

interface CartSummaryProps {
  selectedProducts: readonly CartItemViewModel[];
}

export function CartSummary({ selectedProducts }: CartSummaryProps) {
  const orderSummary = useMemo(() => {
    const purchasable = selectedProducts.filter(item => item.canSelect);
    const itemCount = purchasable.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    const subtotal = purchasable.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const discountAmount = purchasable.reduce(
      (total, item) =>
        total +
        getProductLinePrice(
          item.price,
          item.discountRate,
          item.priceOffset,
          item.quantity,
        ).discountAmount,
      0,
    );
    const shippingFee = 0;
    const optionsTotal = purchasable.reduce(
      (total, item) => total + item.priceOffset * item.quantity,
      0,
    );
    const total = Math.max(
      0,
      subtotal - discountAmount + shippingFee + optionsTotal,
    );

    return {
      itemCount,
      subtotal,
      discountAmount,
      shippingFee,
      total,
      optionsTotal,
    };
  }, [selectedProducts]);

  const [expanded, setExpanded] = useState(false);

  // Shared by the desktop panel and the expanded mobile bar; weight and label color come from the caller.
  const renderDetails = (labelClassName: string) => (
    <>
      <div className="flex justify-between items-center">
        <span className={labelClassName}>상품수</span>
        <span>{orderSummary.itemCount}개</span>
      </div>
      <div className="flex justify-between items-center">
        <span className={labelClassName}>상품 금액</span>
        <span>{orderSummary.subtotal.toLocaleString()}원</span>
      </div>
      <div className="flex justify-between items-center">
        <span className={labelClassName}>상품 할인</span>
        {orderSummary.discountAmount > 0 ? (
          <span className="text-red-500">
            -{orderSummary.discountAmount.toLocaleString()}원
          </span>
        ) : (
          <span>0원</span>
        )}
      </div>
      <div className="flex justify-between items-center">
        <span className={labelClassName}>옵션 추가 금액</span>
        <span>{orderSummary.optionsTotal.toLocaleString()}원</span>
      </div>
      <div className="flex justify-between items-center">
        <span className={labelClassName}>배송비</span>
        {orderSummary.shippingFee > 0 ? (
          <span>{orderSummary.shippingFee.toLocaleString()}원</span>
        ) : (
          <span>무료 배송</span>
        )}
      </div>
    </>
  );

  const handleOrderClick = () => {
    toast.info('주문 기능은 준비 중입니다.', { position: 'bottom-center' });
  };

  return (
    <>
      {expanded && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setExpanded(false)}
        />
      )}
      <div className="fixed inset-x-0 bottom-(--mobile-bottom-nav-height) z-40 border-t border-gray-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:hidden">
        <div
          id="cart-summary-details"
          inert={!expanded}
          className={cn(
            'mx-auto grid max-w-md transition-[grid-template-rows] duration-200 ease-out',
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
          )}
        >
          <div className="overflow-hidden">
            <div className="mb-3 space-y-2.5 border-b border-gray-200 px-1 pt-1 pb-3 text-sm font-medium text-black">
              {renderDetails('text-gray-500')}
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls="cart-summary-details"
            aria-label={`총 결제 금액 ${orderSummary.total.toLocaleString()}원, 결제정보 ${expanded ? '접기' : '펼치기'}`}
            className="-m-1 min-w-0 flex-1 rounded-md p-1 text-left focus-visible:ring-[3px] focus-visible:ring-black/20 focus-visible:outline-none"
            onClick={() => setExpanded(open => !open)}
          >
            <span className="block text-xs font-medium text-gray-500">
              총 결제 금액
            </span>
            <span className="flex items-center gap-1 text-base font-black tracking-tight text-black">
              <span className="truncate">
                {orderSummary.total.toLocaleString()}원
              </span>
              <ChevronUp
                aria-hidden="true"
                className={cn(
                  'size-5 shrink-0 transition-transform duration-200',
                  expanded && 'rotate-180',
                )}
              />
            </span>
          </button>
          <Button
            type="button"
            size="lg"
            disabled={!selectedProducts.some(item => item.canSelect)}
            className="min-w-28 font-black"
            onClick={handleOrderClick}
          >
            주문하기
          </Button>
        </div>
      </div>

      <div className="hidden md:block">
        <div className="bg-black text-white p-8 rounded-md">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b border-gray-800 pb-4">
            결제정보
          </h2>

          <div className="space-y-4 mb-8 font-bold">
            {renderDetails('text-gray-400')}
            <div className="pt-6 border-t border-gray-800 flex justify-between items-end">
              <span className="font-black uppercase">총 결제 금액</span>
              <span className="text-lg font-black tracking-tighter">
                {orderSummary.total.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              size="xl"
              disabled={!selectedProducts.some(item => item.canSelect)}
              className="w-full text-black font-black flex items-center justify-center gap-3 text-lg tracking-widest"
              onClick={handleOrderClick}
            >
              <CreditCard className="size-6" />
              주문하기
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
