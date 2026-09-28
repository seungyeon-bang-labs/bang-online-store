import {
  DataIntegrityError,
  requireRelation,
} from '@/shared/lib/data-integrity';
import type { Product } from '@/domains/product/product.dto';
import type {
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
  OrderStatus,
} from './dto';

export interface OrderJoinedItem {
  item: OrderItemDTO;
  product: Product;
  cancellation: OrderItemCancellationDTO | null;
}

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
  'shipping',
  'delivered',
  'cancelled',
] as const;

export type OrderStatusFilter = (typeof ORDER_STATUS_FILTERS)[number];

export const ORDER_FREE_SHIPPING_THRESHOLD = 50_000;
export const ORDER_STANDARD_SHIPPING_FEE = 3_000;

export interface OrderListQuery {
  period: OrderPeriod;
  status: OrderStatusFilter;
  includePartialCancellation: boolean;
  page: number;
}

export interface OrderActionEligibility {
  canCancel: boolean;
  canClaim: boolean;
}

export function getOrderActionEligibility(
  status: OrderStatus,
): OrderActionEligibility {
  return {
    canCancel:
      status === 'pending_payment' ||
      status === 'payment_completed',
    canClaim: status === 'delivered',
  };
}

export function getOrderShippingFee(itemTotalAmount: number): number {
  return itemTotalAmount === 0 ||
    itemTotalAmount >= ORDER_FREE_SHIPPING_THRESHOLD
    ? 0
    : ORDER_STANDARD_SHIPPING_FEE;
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
  query: Pick<OrderListQuery, 'period' | 'status'> &
    Partial<Pick<OrderListQuery, 'includePartialCancellation'>>,
  now: Date,
): OrderDTO[] {
  const minimumDate = getMinimumDate(query.period, now);

  return orders
    .filter(
      order =>
        query.status === 'all' ||
        (query.status === 'cancelled' && query.includePartialCancellation) ||
        order.status === query.status,
    )
    .filter(
      order =>
        minimumDate === null || new Date(order.ordered_at) >= minimumDate,
    )
    .sort((a, b) => b.ordered_at.localeCompare(a.ordered_at));
}

export function filterOrdersByCancellation(
  orders: readonly OrderDTO[],
  cancellations: readonly OrderItemCancellationDTO[],
  includePartialCancellation: boolean,
): OrderDTO[] {
  if (!includePartialCancellation) return [...orders];

  const cancelledOrderIds = new Set(
    cancellations.map(cancellation => cancellation.order_id),
  );

  return orders.filter(
    order => order.status === 'cancelled' || cancelledOrderIds.has(order.id),
  );
}

export function joinOrderItems(
  orderId: string,
  itemsByOrderId: ReadonlyMap<string, OrderItemDTO[]>,
  productById: ReadonlyMap<number, Product>,
  cancellationByOrderItemId: ReadonlyMap<
    string,
    OrderItemCancellationDTO
  >,
): OrderJoinedItem[] {
  return (itemsByOrderId.get(orderId) ?? []).map(item => {
    const cancellation = cancellationByOrderItemId.get(item.id) ?? null;

    if (cancellation && cancellation.order_id !== orderId) {
      throw new DataIntegrityError(
        'order_item_cancellations order and order_item mismatch',
        cancellation.id,
      );
    }

    return {
      item,
      product: requireRelation(
        productById.get(item.product_id),
        'order_items.product_id -> products.id',
        item.id,
      ),
      cancellation,
    };
  });
}

export function indexOrderItemCancellations(
  cancellations: readonly OrderItemCancellationDTO[],
): ReadonlyMap<string, OrderItemCancellationDTO> {
  return new Map(
    cancellations.map(cancellation => [
      cancellation.order_item_id,
      cancellation,
    ]),
  );
}
