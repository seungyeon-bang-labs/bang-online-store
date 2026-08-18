import {
  DataIntegrityError,
  requireRelation,
} from '@/shared/lib/data-integrity';
import type { Product } from '@/domains/product/product.dto';
import type {
  OrderClaimDTO,
  OrderClaimProgressStage,
  OrderClaimType,
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
  OrderStatus,
} from './dto';

export interface OrderCancellationRefundInput {
  itemId: string;
  itemAmount: number;
}

export interface OrderCancellationRefundAllocation {
  itemId: string;
  itemAmount: number;
  orderDiscountAmount: number;
  pointUsageAmount: number;
  shippingAdjustmentAmount: number;
  refundAmount: number;
}

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
  'preparing_shipment',
  'shipping',
  'delivered',
  'cancelled',
] as const;

export type OrderStatusFilter = (typeof ORDER_STATUS_FILTERS)[number];

export const ORDER_CLAIM_TYPE_FILTERS = [
  'all',
  'exchange',
  'return',
] as const;

export type OrderClaimTypeFilter =
  (typeof ORDER_CLAIM_TYPE_FILTERS)[number];

export const ORDER_CLAIM_STATUS_FILTERS = [
  'all',
  'requested',
  'processing',
  'completed',
  'rejected',
] as const;

export type OrderClaimStatusFilter =
  (typeof ORDER_CLAIM_STATUS_FILTERS)[number];

export const ORDER_CLAIM_REQUEST_TYPES = ['exchange', 'return'] as const;
export const ORDER_CLAIM_REQUEST_REASONS = [
  'change_of_mind',
  'size_or_color',
  'defective_or_wrong',
  'other',
] as const;
export const ORDER_CLAIM_REQUEST_DAYS = 7;
export const ORDER_CLAIM_RETURN_SHIPPING_FEE = 6000;

const ORDER_CLAIM_PROGRESS_STAGES: Record<
  OrderClaimType,
  readonly OrderClaimProgressStage[]
> = {
  exchange: [
    'collection_scheduled',
    'collection_completed',
    'inspecting',
    'exchange_preparing_shipment',
    'exchange_shipping',
  ],
  return: [
    'collection_scheduled',
    'collection_completed',
    'inspecting',
    'refund_processing',
  ],
};

export type OrderClaimRequestType =
  (typeof ORDER_CLAIM_REQUEST_TYPES)[number];
export type OrderClaimRequestReason =
  (typeof ORDER_CLAIM_REQUEST_REASONS)[number];

export function isOrderClaimProgressStageForType(
  type: OrderClaimType,
  progressStage: OrderClaimProgressStage | null,
): boolean {
  return (
    progressStage === null ||
    ORDER_CLAIM_PROGRESS_STAGES[type].includes(progressStage)
  );
}

export interface OrderListQuery {
  period: OrderPeriod;
  status: OrderStatusFilter;
  page: number;
}

export interface OrderClaimListQuery {
  type: OrderClaimTypeFilter;
  status: OrderClaimStatusFilter;
  page: number;
}

export interface OrderActionEligibility {
  canCancel: boolean;
  canClaim: boolean;
}

export type OrderClaimRequestUnavailableReason =
  | 'not_delivered'
  | 'expired'
  | 'cancelled'
  | 'already_claimed';

export function getOrderClaimRequestDeadline(deliveredAt: string): Date {
  const deadline = new Date(deliveredAt);

  deadline.setDate(deadline.getDate() + ORDER_CLAIM_REQUEST_DAYS);
  deadline.setHours(23, 59, 59, 999);

  return deadline;
}

export function getOrderClaimRequestUnavailableReason({
  orderStatus,
  deliveredAt,
  isCancelled,
  hasExistingClaim,
  now = new Date(),
}: {
  orderStatus: OrderStatus;
  deliveredAt: string | null;
  isCancelled: boolean;
  hasExistingClaim: boolean;
  now?: Date;
}): OrderClaimRequestUnavailableReason | null {
  if (orderStatus !== 'delivered' || !deliveredAt) return 'not_delivered';
  if (getOrderClaimRequestDeadline(deliveredAt) < now) return 'expired';
  if (isCancelled) return 'cancelled';
  if (hasExistingClaim) return 'already_claimed';

  return null;
}

export function getOrderClaimRequestShippingFee(
  reason: OrderClaimRequestReason | '',
): number | null {
  if (reason === 'other') return null;

  return reason === 'defective_or_wrong'
    ? 0
    : ORDER_CLAIM_RETURN_SHIPPING_FEE;
}

export function isOrderClaimInspectionRequired(
  reason: OrderClaimRequestReason | '',
): boolean {
  return reason === 'defective_or_wrong' || reason === 'other';
}

export function getOrderClaimExpectedRefundAmount({
  itemAmount,
  reason,
}: {
  itemAmount: number;
  reason: OrderClaimRequestReason | '';
}): number | null {
  const shippingFee = getOrderClaimRequestShippingFee(reason);

  return shippingFee === null ? null : Math.max(0, itemAmount - shippingFee);
}

export type OrderClaimExchangePriceAdjustmentType =
  | 'additional_payment'
  | 'refund'
  | 'none';

export interface OrderClaimExchangePriceAdjustment {
  differenceAmount: number;
  type: OrderClaimExchangePriceAdjustmentType;
}

export function getOrderClaimExchangePriceAdjustment({
  currentItemAmount,
  targetUnitAmount,
  quantity,
}: {
  currentItemAmount: number;
  targetUnitAmount: number;
  quantity: number;
}): OrderClaimExchangePriceAdjustment {
  const differenceAmount = targetUnitAmount * quantity - currentItemAmount;

  return {
    differenceAmount,
    type:
      differenceAmount > 0
        ? 'additional_payment'
        : differenceAmount < 0
          ? 'refund'
          : 'none',
  };
}

export function getOrderActionEligibility(
  status: OrderStatus,
): OrderActionEligibility {
  return {
    canCancel:
      status === 'pending_payment' ||
      status === 'payment_completed' ||
      status === 'preparing_shipment',
    canClaim: status === 'delivered',
  };
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

function allocateProportionally(
  totalAmount: number,
  items: readonly OrderCancellationRefundInput[],
): ReadonlyMap<string, number> {
  const totalWeight = items.reduce((sum, item) => sum + item.itemAmount, 0);
  if (totalAmount <= 0 || totalWeight <= 0) {
    return new Map(items.map(item => [item.itemId, 0]));
  }

  let allocatedAmount = 0;
  return new Map(
    items.map((item, index) => {
      const amount =
        index === items.length - 1
          ? totalAmount - allocatedAmount
          : Math.floor((totalAmount * item.itemAmount) / totalWeight);
      allocatedAmount += amount;
      return [item.itemId, amount];
    }),
  );
}

/**
 * 주문 단위 할인·적립금 사용액은 취소 상품의 결제 금액 비율로 배분한다.
 * 소수점으로 남은 금액은 마지막 취소 상품에 더해 총액 보존을 보장한다.
 */
export function calculateCancellationRefundAllocations({
  cancelledItems,
  orderDiscountAmount,
  pointUsageAmount,
  shippingAdjustmentAmount = 0,
}: {
  cancelledItems: readonly OrderCancellationRefundInput[];
  orderDiscountAmount: number;
  pointUsageAmount: number;
  shippingAdjustmentAmount?: number;
}): OrderCancellationRefundAllocation[] {
  const orderDiscountByItem = allocateProportionally(
    orderDiscountAmount,
    cancelledItems,
  );
  const pointUsageByItem = allocateProportionally(
    pointUsageAmount,
    cancelledItems,
  );
  const shippingAdjustmentByItem = allocateProportionally(
    shippingAdjustmentAmount,
    cancelledItems,
  );

  return cancelledItems.map(item => {
    const orderDiscount = orderDiscountByItem.get(item.itemId) ?? 0;
    const pointUsage = pointUsageByItem.get(item.itemId) ?? 0;
    const shippingAdjustment = shippingAdjustmentByItem.get(item.itemId) ?? 0;

    return {
      itemId: item.itemId,
      itemAmount: item.itemAmount,
      orderDiscountAmount: orderDiscount,
      pointUsageAmount: pointUsage,
      shippingAdjustmentAmount: shippingAdjustment,
      refundAmount: Math.max(
        0,
        item.itemAmount - orderDiscount - pointUsage - shippingAdjustment,
      ),
    };
  });
}
