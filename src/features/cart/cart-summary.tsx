import { Button } from '@/shared/components/ui/button';
import { useMemo, useState } from 'react';
import { ChevronUp, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getOrderAmounts } from '@/domains/order/domain';
import { getOrderBlock } from '@/domains/order/place-order';
import { getOrderBlockMessage } from '@/features/checkout/checkout-messages';
import { getCartLineStatus } from '@/domains/cart/domain';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { getCheckoutHref } from '@/shared/lib/checkout-routes';
import { cn } from '@/shared/lib/utils';
import { lineStatusShortReason } from './cart-messages';
import { selectCartLocked } from './cart-selectors';
import { useCartCommands, useCartState } from './use-cart';

import type { CartItemViewModel } from '@/domains/cart/view-model';

interface CartSummaryProps {
  selectedProducts: readonly CartItemViewModel[];
}

// The cart page gives each line this id so 주문하기 can bring the first problem line into view.
export const getCartItemElementId = (itemId: string) => `cart-item-${itemId}`;

export function CartSummary({ selectedProducts }: CartSummaryProps) {
  const optionGroups = useCartState(state => state.cart?.optionGroups);
  // Checked only against what the page already shows; place_order checks the database at payment.
  const problems = useMemo(
    () =>
      selectedProducts.flatMap(item => {
        const status = getCartLineStatus(item, optionGroups ?? {});
        return status === 'ok' ? [] : [{ item, status }];
      }),
    [selectedProducts, optionGroups],
  );
  const [problemsOpen, setProblemsOpen] = useState(false);
  const [scrollOnClose, setScrollOnClose] = useState(false);
  const { setSelected } = useCartCommands();
  // A discontinued line has no current price (its discount is no longer read), so the amounts leave it out.
  const pricedProducts = useMemo(
    () => selectedProducts.filter(item => !item.discontinued),
    [selectedProducts],
  );
  const orderSummary = useMemo(() => {
    const amounts = getOrderAmounts(pricedProducts);

    return {
      itemCount: amounts.itemCount,
      subtotal: amounts.productAmount,
      discountAmount: amounts.discountAmount,
      shippingFee: amounts.shippingFee,
      total: amounts.totalAmount,
      optionsTotal: amounts.optionAmount,
    };
  }, [pricedProducts]);
  const access = useCartState(state => state.access);
  // A pending change would reach checkout as the old lines; wait until it settles.
  const locked = useCartState(selectCartLocked);
  // Discontinued lines alone add up to 0원; the problem popup stops them instead of a disabled button.
  const block =
    pricedProducts.length > 0
      ? getOrderBlock({ lineCount: selectedProducts.length, totalAmount: orderSummary.total })
      : null;
  const canOrder = selectedProducts.length > 0 && block === null && !locked;
  const router = useRouter();

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

  const order = (items: readonly CartItemViewModel[]) => {
    if (access?.status === 'member') {
      router.push(getCheckoutHref(items.map(item => item.id)));
    } else if (access?.status === 'guest') {
      router.push('/login');
    } else {
      toast.info('지금은 주문할 수 없습니다. 잠시 후 다시 시도해 주세요.', {
        position: 'bottom-center',
      });
    }
  };

  const handleOrderClick = () => {
    if (!canOrder) return;
    if (problems.length > 0) {
      setScrollOnClose(false);
      setProblemsOpen(true);
      return;
    }
    order(selectedProducts);
  };

  // Only the selection changes; the problem lines stay in the cart with their reasons.
  const handleOrderOthers = () => {
    setProblemsOpen(false);
    for (const { item } of problems) setSelected(item.id, false);
    order(selectedProducts.filter(item => !problems.some(problem => problem.item.id === item.id)));
  };

  const scrollToFirstProblem = () => {
    const first = problems[0];
    if (!first) return;
    document
      .getElementById(getCartItemElementId(first.item.id))
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      <Dialog open={problemsOpen} onOpenChange={setProblemsOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-sm! rounded-md"
          // Only 확인하기 moves the page; outside click and Esc just close.
          onCloseAutoFocus={event => {
            if (!scrollOnClose) return;
            event.preventDefault();
            scrollToFirstProblem();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              주문할 수 없는 상품이 있습니다
            </DialogTitle>
            <DialogDescription asChild>
              {/* A long list scrolls inside the popup so its buttons stay on screen. */}
              <ul className="max-h-[40dvh] space-y-1 overflow-y-auto text-sm font-medium text-gray-600">
                {problems.map(({ item, status }) => (
                  <li key={item.id}>
                    · {item.name} {item.color} / {item.size} —{' '}
                    {lineStatusShortReason(status, item.stock)}
                  </li>
                ))}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-md border-gray-200 font-bold"
              onClick={() => {
                setScrollOnClose(true);
                setProblemsOpen(false);
              }}
            >
              확인하기
            </Button>
            {problems.length > 0 && problems.length < selectedProducts.length && (
              <Button
                type="button"
                className="flex-1 rounded-md font-bold"
                onClick={handleOrderOthers}
              >
                주문 가능한 상품만 주문하기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            disabled={!canOrder}
            className="min-w-28 font-black"
            onClick={handleOrderClick}
          >
            주문하기
          </Button>
        </div>
        {block !== null && (
          <p className="mx-auto mt-2 max-w-md text-center text-xs text-gray-500">
            {getOrderBlockMessage(block)}
          </p>
        )}
      </div>

      <div className="hidden md:block">
        <div className="bg-black text-white p-8 rounded-md">
          <h2 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b border-gray-800 pb-4">
            결제정보
          </h2>

          <div className="space-y-4 mb-8 font-medium">
            {renderDetails('text-gray-400')}
            <div className="pt-6 border-t border-gray-800 flex justify-between items-end">
              <span className="font-bold">총 결제 금액</span>
              <span className="text-[28px] leading-none font-black tracking-tight">
                {orderSummary.total.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              size="xl"
              disabled={!canOrder}
              className="w-full text-black font-black flex items-center justify-center gap-3 text-lg"
              onClick={handleOrderClick}
            >
              <CreditCard className="size-6" />
              주문하기
            </Button>
            {block !== null && (
              <p className="text-center text-xs text-gray-400">
                {getOrderBlockMessage(block)}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
