import type { OrderStatus } from '@/domains/order/dto';
import type { OrderListItemViewModel } from '@/domains/order/view-model';
import type { MypageHomeReviewState } from './home.view-model';

export const MYPAGE_HOME_ORDER_STATUS_SUMMARY_STATUSES = [
  'pending_payment',
  'payment_completed',
  'preparing_shipment',
  'shipping',
  'delivered',
] as const satisfies readonly Exclude<OrderStatus, 'cancelled'>[];

export function getMypageHomeReviewState(
  order: OrderListItemViewModel,
  reviewedItemIds: ReadonlySet<string>,
): MypageHomeReviewState {
  if (order.statusCode !== 'delivered') {
    return 'unavailable';
  }

  return order.items.length > 0 &&
    order.items.every(item => reviewedItemIds.has(item.id))
    ? 'written'
    : 'writable';
}
