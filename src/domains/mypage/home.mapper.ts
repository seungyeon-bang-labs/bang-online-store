import { getOrderActionEligibility } from '@/domains/order';
import type { OrderDTO } from '@/domains/order/dto';
import type { OrderListItemViewModel } from '@/domains/order/view-model';
import { buildQueryHref } from '@/shared/lib/query';
import { getMypageHomeReviewState } from './home.domain';
import { buildMypageHomeOrderActions } from './home.order-policy';
import type { MypageHomeRecentOrderViewModel } from './home.view-model';

interface MypageHomeRecentOrderMapperInput {
  order: OrderDTO;
  orderViewModel: OrderListItemViewModel;
  writableReviewOrderItemIds: ReadonlySet<string>;
  reviewedOrderItemIds: ReadonlySet<string>;
}

export function toMypageHomeRecentOrderViewModel({
  order,
  orderViewModel,
  writableReviewOrderItemIds,
  reviewedOrderItemIds,
}: MypageHomeRecentOrderMapperInput): MypageHomeRecentOrderViewModel {
  const orderHref = buildMypageHomeOrderHref(order.status);
  const reviewState = getMypageHomeReviewState(
    orderViewModel,
    writableReviewOrderItemIds,
    reviewedOrderItemIds,
  );
  const { canCancel, canClaim } = getOrderActionEligibility(order.status);

  return {
    ...orderViewModel,
    productSummary: getMypageHomeProductSummary(orderViewModel),
    orderHref,
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
    period: '1-month',
    status,
    page: 1,
  });
}
