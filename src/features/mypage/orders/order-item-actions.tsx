'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/domains/cart';
import type {
  OrderItemActionViewModel,
  OrderItemActionsViewModel,
} from '@/domains/order';
import { getMypageOrderReceiptHref } from '@/shared/lib/mypage-routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cancelDemoOrderItem } from '@/app/(main)/mypage/orders/actions';

interface MypageOrderItemActionsProps {
  actions: OrderItemActionsViewModel;
  productName: string;
  orderId: string;
  orderItemId: string;
  repurchaseItem: {
    productId: number;
    variantId: string;
    quantity: number;
  } | null;
}

export function MypageOrderItemActions({
  actions,
  productName,
  orderId,
  orderItemId,
  repurchaseItem,
}: MypageOrderItemActionsProps) {
  const [isPending, startTransition] = useTransition();
  const addToCart = useCartStore(state => state.addToCart);

  const runAction = (action: OrderItemActionViewModel) => {
    if (action.type === 'cancel') {
      startTransition(async () => {
        try {
          await cancelDemoOrderItem(orderId, orderItemId);
          toast.success('상품을 취소하고 환불 내역을 반영했습니다.', {
            position: 'bottom-center',
          });
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : '주문 취소에 실패했습니다.',
            { position: 'bottom-center' },
          );
        }
      });
      return;
    }

    if (action.type === 'repurchase' && repurchaseItem) {
      addToCart(
        repurchaseItem.productId,
        repurchaseItem.variantId,
        repurchaseItem.quantity,
      );
      toast.success('상품을 장바구니에 다시 담았습니다.', {
        position: 'bottom-center',
      });
      return;
    }

    if (action.type === 'tracking' || action.type === 'payment') {
      toast.info(
        action.type === 'tracking'
          ? '데모 주문의 배송 조회 정보입니다.'
          : '데모 주문의 결제 정보입니다.',
        { position: 'bottom-center' },
      );
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
      <OrderItemActionButton
        action={actions.primary}
        orderId={orderId}
        isPending={isPending}
        onAction={runAction}
      />
      <OrderItemActionButton
        action={actions.secondary}
        orderId={orderId}
        isPending={isPending}
        onAction={runAction}
      />
      {actions.more.length > 0 ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-sm border-zinc-300 shadow-none"
              aria-label={`${productName} 추가 액션: ${actions.more
                .map(action => action.label)
                .join(', ')}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32">
            {actions.more.map(action => (
              <OrderItemMenuAction
                key={action.type}
                action={action}
                orderId={orderId}
                isPending={isPending}
                onAction={runAction}
              />
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}

interface OrderItemActionProps {
  action: OrderItemActionViewModel;
  orderId: string;
  isPending: boolean;
  onAction: (action: OrderItemActionViewModel) => void;
}

function getOrderItemActionHref(
  orderId: string,
  action: OrderItemActionViewModel,
): string | null {
  if (action.type === 'receipt' || action.type === 'refund') {
    return getMypageOrderReceiptHref(orderId);
  }
  if (action.type === 'review') return '/mypage/reviews?tab=available&page=1';
  if (action.type === 'claim') return '/mypage/returns';
  if (action.type === 'inquiry') return '/mypage/inquiries';
  return null;
}

function OrderItemActionButton({
  action,
  orderId,
  isPending,
  onAction,
}: OrderItemActionProps) {
  const href = getOrderItemActionHref(orderId, action);
  const className =
    'w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white';

  if (href) {
    return (
      <Button variant="outline" size="sm" asChild className={className}>
        <Link href={href}>{action.label}</Link>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isPending}
      className={className}
      onClick={() => onAction(action)}
    >
      {action.label}
    </Button>
  );
}

function OrderItemMenuAction({
  action,
  orderId,
  isPending,
  onAction,
}: OrderItemActionProps) {
  const href = getOrderItemActionHref(orderId, action);
  const className = 'cursor-pointer font-bold focus:bg-black focus:text-white';

  if (href) {
    return (
      <DropdownMenuItem asChild className={className}>
        <Link href={href}>{action.label}</Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      disabled={isPending}
      className={className}
      onSelect={() => onAction(action)}
    >
      {action.label}
    </DropdownMenuItem>
  );
}
