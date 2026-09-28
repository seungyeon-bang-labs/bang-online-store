import type { OrderStatus } from '../dto';
import type {
  OrderClaimDTO,
  OrderClaimProgressStage,
  OrderClaimType,
} from './dto';

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
  'cancelled',
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

export interface OrderClaimListQuery {
  type: OrderClaimTypeFilter;
  status: OrderClaimStatusFilter;
  page: number;
}

export function canCancelOrderClaim(
  claim: Pick<OrderClaimDTO, 'status' | 'progress_stage'>,
): boolean {
  return claim.status === 'requested' && claim.progress_stage === null;
}

export type OrderClaimRequestUnavailableReason =
  | 'not_delivered'
  | 'expired'
  | 'cancelled'
  | 'already_claimed';

export function isOrderClaimProgressStageForType(
  type: OrderClaimType,
  progressStage: OrderClaimProgressStage | null,
): boolean {
  return (
    progressStage === null ||
    ORDER_CLAIM_PROGRESS_STAGES[type].includes(progressStage)
  );
}

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

export function hasSameOrderClaimExchangeOptionPrice({
  currentUnitAmount,
  targetUnitAmount,
}: {
  currentUnitAmount: number;
  targetUnitAmount: number;
}): boolean {
  return currentUnitAmount === targetUnitAmount;
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
    .sort((left, right) => right.requested_at.localeCompare(left.requested_at));
}
