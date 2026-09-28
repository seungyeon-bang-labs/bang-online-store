'use client';

import {
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_ACTION_MENU_CLASS_NAME,
} from '../common/styles';

import Link from 'next/link';
import { Fragment } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/shared/components/ui/button';
import { useCartStore } from '@/domains/cart';
import type {
  OrderItemActionViewModel,
  OrderItemActionsViewModel,
} from '@/domains/order';
import {
  getMypageOrderCancellationHref,
  getMypageOrderClaimRequestHref,
  getMypageInquiryWriteHref,
  getMypageOrderReceiptHref,
  getMypageReviewWriteHref,
} from '@/shared/lib/mypage-routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

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
  const addToCart = useCartStore(state => state.addToCart);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const returnTo = search ? `${pathname}?${search}` : pathname;

  const runAction = (action: OrderItemActionViewModel) => {
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
        orderItemId={orderItemId}
        returnTo={returnTo}
        onAction={runAction}
      />
      <OrderItemActionButton
        action={actions.secondary}
        orderId={orderId}
        orderItemId={orderItemId}
        returnTo={returnTo}
        onAction={runAction}
      />
      {actions.more.length > 0 ? (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className={`rounded-sm ${MYPAGE_ACTION_CLASS_NAME.outline} ${MYPAGE_ACTION_MENU_CLASS_NAME.outlineTrigger}`}
              aria-label={`${productName} 추가 메뉴`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={MYPAGE_ACTION_MENU_CLASS_NAME.content}
          >
            {actions.more.map((action, index) => (
              <Fragment key={action.type}>
                <OrderItemMenuAction
                  action={action}
                  orderId={orderId}
                  orderItemId={orderItemId}
                  returnTo={returnTo}
                  onAction={runAction}
                />
                {index < actions.more.length - 1 && (
                  <DropdownMenuSeparator
                    className={MYPAGE_ACTION_MENU_CLASS_NAME.separator}
                  />
                )}
              </Fragment>
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
  orderItemId: string;
  returnTo: string;
  onAction: (action: OrderItemActionViewModel) => void;
}

function getOrderItemActionHref(
  orderId: string,
  orderItemId: string,
  returnTo: string,
  action: OrderItemActionViewModel,
): string | null {
  if (action.type === 'receipt' || action.type === 'refund') {
    return getMypageOrderReceiptHref(orderId);
  }
  if (action.type === 'cancel') {
    return getMypageOrderCancellationHref(orderId, orderItemId, returnTo);
  }
  if (action.type === 'review') {
    return getMypageReviewWriteHref(orderItemId, returnTo);
  }
  if (action.type === 'claim') {
    return getMypageOrderClaimRequestHref(orderId, orderItemId, returnTo);
  }
  if (action.type === 'inquiry') {
    return getMypageInquiryWriteHref({ orderId, orderItemId, returnTo });
  }
  return null;
}

function OrderItemActionButton({
  action,
  orderId,
  orderItemId,
  returnTo,
  onAction,
}: OrderItemActionProps) {
  const href = getOrderItemActionHref(orderId, orderItemId, returnTo, action);
  const className =
    `w-full ${MYPAGE_ACTION_CLASS_NAME.outline}`;

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
  orderItemId,
  returnTo,
  onAction,
}: OrderItemActionProps) {
  const href = getOrderItemActionHref(orderId, orderItemId, returnTo, action);
  const className = MYPAGE_ACTION_MENU_CLASS_NAME.item;

  if (href) {
    return (
      <DropdownMenuItem asChild className={className}>
        <Link href={href}>{action.label}</Link>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem
      className={className}
      onSelect={() => onAction(action)}
    >
      {action.label}
    </DropdownMenuItem>
  );
}
