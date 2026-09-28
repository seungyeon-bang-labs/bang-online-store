import type { OrderStatus } from '@/domains/order/dto';
import type { OrderListItemViewModel } from '@/domains/order/view-model';
import type { MypageHomeReviewState } from './home.view-model';

export const MYPAGE_HOME_ORDER_STATUS_SUMMARY_STATUSES = [
  'pending_payment',
  'payment_completed',
  'shipping',
  'delivered',
  'cancelled',
] as const satisfies readonly OrderStatus[];

export function getMypageHomeReviewState(
  order: OrderListItemViewModel,
  writableReviewOrderItemIds: ReadonlySet<string>,
  reviewedOrderItemIds: ReadonlySet<string>,
): MypageHomeReviewState {
  if (order.statusCode !== 'delivered') {
    return 'unavailable';
  }

  if (order.items.some(item => writableReviewOrderItemIds.has(item.id))) {
    return 'writable';
  }

  return order.items.some(item => reviewedOrderItemIds.has(item.id))
    ? 'written'
    : 'unavailable';
}
