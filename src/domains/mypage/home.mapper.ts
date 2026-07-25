import { getOrderActionEligibility } from '@/domains/order';
import type { OrderDTO } from '@/domains/order/dto';
import type { OrderListItemViewModel } from '@/domains/order/view-model';
import { buildQueryHref } from '@/shared/lib/query';
import { getMypageHomeReviewState } from './home.domain';
import {
  buildMypageHomeOrderActions,
  getMypageHomeOrderStatusDescription,
} from './home.order-policy';
import type { MypageHomeRecentOrderViewModel } from './home.view-model';

interface MypageHomeRecentOrderMapperInput {
  order: OrderDTO;
  orderViewModel: OrderListItemViewModel;
  reviewedItemIds: ReadonlySet<string>;
}

export function toMypageHomeRecentOrderViewModel({
  order,
  orderViewModel,
  reviewedItemIds,
}: MypageHomeRecentOrderMapperInput): MypageHomeRecentOrderViewModel {
  const orderHref = buildMypageHomeOrderHref(order.status);
  const reviewState = getMypageHomeReviewState(
    orderViewModel,
    reviewedItemIds,
  );
  const { canCancel, canClaim } = getOrderActionEligibility(order.status);

  return {
    ...orderViewModel,
    productSummary: getMypageHomeProductSummary(orderViewModel),
    orderHref,
    statusDescription: getMypageHomeOrderStatusDescription({
      status: order.status,
      orderedAt: order.ordered_at,
      paymentDueAt: order.payment_due_at,
      paidAt: order.paid_at,
      estimatedDeliveryAt: order.estimated_delivery_at,
      cancelledAt: order.cancelled_at,
      paymentMethod: order.payment_method,
    }),
    actions: buildMypageHomeOrderActions({
      status: order.status,
      reviewState,
      itemCount: orderViewModel.items.length,
      canCancel,
      canClaim,
      repurchaseItem:
        orderViewModel.items.length === 1
          ? orderViewModel.items[0].repurchaseItem
          : null,
      links: {
        payment: 'placeholder',
        cancel: 'placeholder',
        order: orderHref,
        tracking: 'placeholder',
        reviewWrite: '/mypage/reviews?tab=available&page=1',
        reviewEdit: '/mypage/reviews?tab=completed&page=1',
        claim: '/cs/return-request',
        receipt: 'placeholder',
        refund: 'placeholder',
        inquiry: '/mypage/inquiries',
      },
    }),
  };
}

function getMypageHomeProductSummary(order: OrderListItemViewModel): string {
  const firstItem = order.items[0];

  if (!firstItem) {
    return '주문 상품 정보 없음';
  }

  return firstItem.productName +
    (order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : '');
}

function buildMypageHomeOrderHref(status: OrderDTO['status']): string {
  return buildQueryHref('/mypage/orders', {
    period: '3-months',
    status,
    page: 1,
  });
}
