import type { OrderClaimDTO, OrderDTO } from './order.dto';

export const ORDER_PERIODS = [
  '1-month',
  '3-months',
  '6-months',
  '12-months',
  'all',
] as const;

export type OrderPeriod = (typeof ORDER_PERIODS)[number];

export const ORDER_STATUS_FILTERS = [
  'all',
  'pending_payment',
  'payment_completed',
  'preparing_shipment',
  'shipping',
  'delivered',
  'cancelled',
] as const;

export type OrderStatusFilter = (typeof ORDER_STATUS_FILTERS)[number];

export const ORDER_CLAIM_TYPE_FILTERS = [
  'all',
  'cancel',
  'exchange',
  'return',
] as const;

export const ORDER_CLAIM_STATUS_FILTERS = [
  'all',
  'requested',
  'processing',
  'completed',
  'rejected',
] as const;

export interface OrderListQuery {
  period: OrderPeriod;
  status: OrderStatusFilter;
  page: number;
}

export interface OrderClaimListQuery {
  type: (typeof ORDER_CLAIM_TYPE_FILTERS)[number];
  status: (typeof ORDER_CLAIM_STATUS_FILTERS)[number];
  page: number;
}

function getMinimumDate(period: OrderPeriod, now: Date): Date | null {
  if (period === 'all') return null;

  const monthsByPeriod: Record<Exclude<OrderPeriod, 'all'>, number> = {
    '1-month': 1,
    '3-months': 3,
    '6-months': 6,
    '12-months': 12,
  };
  const minimumDate = new Date(now);
  minimumDate.setMonth(minimumDate.getMonth() - monthsByPeriod[period]);
  return minimumDate;
}

export function filterOrders(
  orders: readonly OrderDTO[],
  query: Pick<OrderListQuery, 'period' | 'status'>,
  now: Date,
): OrderDTO[] {
  const minimumDate = getMinimumDate(query.period, now);

  return orders
    .filter(order => query.status === 'all' || order.status === query.status)
    .filter(
      order =>
        minimumDate === null || new Date(order.ordered_at) >= minimumDate,
    )
    .sort((a, b) => b.ordered_at.localeCompare(a.ordered_at));
}

export function filterOrderClaims(
  claims: readonly OrderClaimDTO[],
  query: Pick<OrderClaimListQuery, 'type' | 'status'>,
): OrderClaimDTO[] {
  return claims
    .filter(claim => query.type === 'all' || claim.claim_type === query.type)
    .filter(
      claim => query.status === 'all' || claim.status === query.status,
    )
    .sort((a, b) => b.requested_at.localeCompare(a.requested_at));
}
