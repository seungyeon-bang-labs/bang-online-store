import { getOrderActionEligibility } from '@/domains/order';
import type { OrderDTO } from '@/domains/order/dto';
import type { OrderListItemViewModel } from '@/domains/order/view-model';
import {
  getMypageOrderCancellationHref,
  getMypageOrderDetailHref,
  getMypageInquiryWriteHref,
  getMypageOrderReceiptHref,
} from '@/shared/lib/mypage-routes';
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
  const orderHref = getMypageOrderDetailHref(order.id);
  const singleItem =
    orderViewModel.items.length === 1 ? orderViewModel.items[0] ?? null : null;
  const cancellationHref =
    singleItem
      ? getMypageOrderCancellationHref(
          order.id,
          singleItem.id,
          '/mypage',
        )
      : orderHref;
  const inquiryHref = singleItem
    ? getMypageInquiryWriteHref({
        orderId: order.id,
        orderItemId: singleItem.id,
        returnTo: '/mypage',
      })
    : null;
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
      repurchaseItem: singleItem?.repurchaseItem ?? null,
      links: {
        payment: 'placeholder',
        cancel: cancellationHref,
        order: orderHref,
        tracking: 'placeholder',
        reviewWrite: '/mypage/reviews?tab=available&page=1',
        reviewEdit: '/mypage/reviews?tab=completed&page=1',
        claim: orderHref,
        receipt: getMypageOrderReceiptHref(order.id),
        refund: getMypageOrderReceiptHref(order.id),
        inquiry: inquiryHref,
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
