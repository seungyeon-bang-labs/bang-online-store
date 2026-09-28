import {
  toProductCardViewModel,
  toProductColorViewModels,
  type Product,
} from '@/domains/product';
import {
  formatKoreanDate,
  formatKoreanMoney,
  formatKoreanShortDateTime,
} from '@/shared/lib/format';
import type { StatusViewModel } from '@/shared/types/status';
import {
  canCancelOrderClaim,
  hasSameOrderClaimExchangeOptionPrice,
  isOrderClaimProgressStageForType,
  type OrderClaimRequestUnavailableReason,
} from './domain';
import type {
  OrderClaimDTO,
  OrderClaimHistoryDTO,
  OrderClaimHistoryEvent,
  OrderClaimSettlementDTO,
  OrderClaimStatus,
  OrderClaimType,
} from './dto';
import type { OrderDTO, OrderItemDTO } from '../dto';
import type {
  OrderClaimDetailAddressViewModel,
  OrderClaimDetailExchangeProductViewModel,
  OrderClaimRequestViewModel,
  OrderClaimRefundAmountViewModel,
  OrderClaimDetailViewModel,
  OrderClaimHistoryViewModel,
  OrderClaimProductViewModel,
  OrderClaimDetailProductViewModel,
  OrderClaimSettlementViewModel,
  OrderClaimViewModel,
} from './view-model';

const ORDER_CLAIM_TYPE_VIEW: Record<OrderClaimType, StatusViewModel> = {
  exchange: { label: '교환', tone: 'neutral' },
  return: { label: '반품', tone: 'neutral' },
};

const ORDER_CLAIM_STATUS_VIEW: Record<OrderClaimStatus, StatusViewModel> = {
  requested: { label: '신청', tone: 'warning' },
  processing: { label: '처리중', tone: 'info' },
  completed: { label: '처리완료', tone: 'success' },
  rejected: { label: '반려', tone: 'danger' },
  cancelled: { label: '신청 취소', tone: 'danger' },
};

const ORDER_CLAIM_HISTORY_EVENT_LABEL: Record<
  OrderClaimHistoryEvent,
  string
> = {
  requested: '신청 완료',
  collection_scheduled: '회수 예정',
  collection_completed: '회수 완료',
  inspecting: '검수 중',
  exchange_preparing_shipment: '교환 상품 배송 준비',
  exchange_shipping: '교환 상품 배송 중',
  refund_processing: '환불 처리 중',
  completed: '처리 완료',
  rejected: '신청 반려',
  cancelled: '신청 취소',
};

export const toOrderClaimTypeViewModel = (
  type: OrderClaimType,
): StatusViewModel => ORDER_CLAIM_TYPE_VIEW[type];

export const toOrderClaimStatusViewModel = (
  status: OrderClaimStatus,
): StatusViewModel => ORDER_CLAIM_STATUS_VIEW[status];

export function toOrderClaimViewModel(
  claim: OrderClaimDTO,
  order: OrderDTO,
  item: OrderItemDTO,
  product: Product,
  settlement: OrderClaimSettlementDTO | null,
  histories: readonly OrderClaimHistoryDTO[],
): OrderClaimViewModel {
  return {
    id: claim.id,
    orderNumber: order.order_number,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    lineTotalText: formatKoreanMoney(item.line_total_amount),
    type: toOrderClaimTypeViewModel(claim.claim_type),
    status: toOrderClaimStatusViewModel(claim.status),
    statusDescription: toOrderClaimStatusDescription(claim, histories),
    reason: claim.reason,
    refundAmount: toOrderClaimRefundAmountViewModel(claim, settlement),
    actions: { canCancel: canCancelOrderClaim(claim) },
  };
}

function toOrderClaimStatusDescription(
  claim: OrderClaimDTO,
  histories: readonly OrderClaimHistoryDTO[],
): string {
  const currentEvent = getOrderClaimCurrentHistoryEvent(claim);
  const currentHistory = histories
    .filter(history => history.event === currentEvent)
    .sort((left, right) => right.occurred_at.localeCompare(left.occurred_at))[0];

  if (!currentHistory && claim.status === 'processing') {
    return `${formatKoreanDate(claim.requested_at)} 신청`;
  }

  const occurredAt =
    currentHistory?.occurred_at ??
    (currentEvent === 'completed' || currentEvent === 'rejected'
      ? claim.completed_at
      : currentEvent === 'cancelled'
        ? claim.cancelled_at
        : claim.requested_at);

  return `${formatKoreanDate(occurredAt ?? claim.requested_at)} ${
    currentEvent === 'requested'
      ? '신청'
      : ORDER_CLAIM_HISTORY_EVENT_LABEL[currentEvent]
  }`;
}

function toOrderClaimRefundAmountViewModel(
  claim: OrderClaimDTO,
  settlement: OrderClaimSettlementDTO | null,
): OrderClaimRefundAmountViewModel | null {
  if (
    claim.claim_type !== 'return' ||
    (claim.status !== 'processing' && claim.status !== 'completed') ||
    settlement?.type !== 'refund' ||
    settlement.status === 'unavailable'
  ) {
    return null;
  }

  return {
    label:
      settlement.status === 'pending' ? '환불 예정 금액' : '환불 완료 금액',
    amountText: formatKoreanMoney(settlement.amount),
  };
}

export function toOrderClaimDetailViewModel(
  claim: OrderClaimDTO,
  order: OrderDTO,
  item: OrderItemDTO,
  product: Product,
  exchangeProduct: Product | null,
  histories: readonly OrderClaimHistoryDTO[],
  settlement: OrderClaimSettlementDTO | null,
): OrderClaimDetailViewModel {
  const currentEvent = getOrderClaimCurrentHistoryEvent(claim);
  const orderedItem = toOrderClaimProductViewModel(item, product);
  const historiesViewModel = histories
    .slice()
    .sort(
      (left, right) =>
        new Date(left.occurred_at).getTime() -
        new Date(right.occurred_at).getTime(),
    )
    .map(history => toOrderClaimHistoryViewModel(history, currentEvent));
  const productViewModel: OrderClaimDetailProductViewModel =
    claim.claim_type === 'exchange'
      ? toOrderClaimExchangeDetailProductViewModel({
          item,
          orderedItem,
          exchangeProduct,
          exchangeVariantId: claim.exchange_variant_id,
        })
      : {
          kind: 'return',
          title: '반품 상품',
          item: orderedItem,
        };
  const addressViewModel: OrderClaimDetailAddressViewModel = {
    title: claim.claim_type === 'exchange' ? '회수·배송지 정보' : '회수지 정보',
    description:
      claim.claim_type === 'exchange'
        ? '회수와 교환 상품 배송에 동일한 주소를 사용합니다.'
        : null,
    contactName: order.recipient_name,
    contactPhone: order.recipient_phone,
    addressText: order.shipping_address_text,
    postalCode: order.postal_code,
  };

  return {
    information: {
      orderNumber: order.order_number,
      requestedAt: formatKoreanDate(claim.requested_at),
      completedAt: claim.completed_at
        ? formatKoreanDate(claim.completed_at)
        : null,
      cancelledAt: claim.cancelled_at
        ? formatKoreanDate(claim.cancelled_at)
        : null,
    },
    request: {
      type: toOrderClaimTypeViewModel(claim.claim_type),
      reason: claim.reason,
      description: claim.description,
    },
    rejectionNotice:
      claim.status === 'rejected' && claim.rejection_reason
        ? { reason: claim.rejection_reason }
        : null,
    processingHistory: { histories: historiesViewModel },
    product: productViewModel,
    address: addressViewModel,
    refund:
      settlement?.type === 'refund'
        ? toOrderClaimSettlementViewModel(settlement)
        : null,
  };
}

function toOrderClaimExchangeDetailProductViewModel({
  item,
  orderedItem,
  exchangeProduct,
  exchangeVariantId,
}: {
  item: OrderItemDTO;
  orderedItem: OrderClaimProductViewModel;
  exchangeProduct: Product | null;
  exchangeVariantId: string | null;
}): OrderClaimDetailExchangeProductViewModel {
  if (!exchangeProduct || !exchangeVariantId) {
    throw new Error('Exchange claims require a target product and option.');
  }

  return {
    kind: 'exchange',
    orderedItem,
    exchangeItem: toOrderClaimExchangeProductViewModel(
      item,
      exchangeProduct,
      exchangeVariantId,
    ),
  };
}

function toOrderClaimSettlementViewModel(
  settlement: OrderClaimSettlementDTO,
): OrderClaimSettlementViewModel {
  if (settlement.type === 'none') {
    return {
      label: '정산 금액',
      amountText: null,
      description:
        settlement.status === 'unavailable'
          ? '검수 완료 후 정산 금액이 확정됩니다.'
          : '추가 결제 또는 환불 금액이 없습니다.',
      tone: 'default',
    };
  }

  const isAdditionalPayment = settlement.type === 'additional_payment';
  const isPending = settlement.status === 'pending';
  const paymentMethod =
    settlement.payment_method === '신용카드'
      ? '신용카드로'
      : settlement.payment_method
        ? `${settlement.payment_method}으로`
        : '결제수단으로';
  const actionLabel = isAdditionalPayment ? '추가 결제' : '환불';
  const statusLabel = isPending ? '예정' : '완료';
  const date = isPending ? settlement.expected_at : settlement.completed_at;

  return {
    label: isAdditionalPayment
      ? '추가 결제 금액'
      : isPending
        ? '환불 예정 금액'
        : '환불 완료 금액',
    amountText: formatKoreanMoney(settlement.amount),
    description: date
      ? `${formatKoreanDate(date)}${isPending ? ' 이내' : ''} ${paymentMethod} ${actionLabel} ${statusLabel}`
      : `${paymentMethod} ${actionLabel} ${statusLabel}`,
    tone: isAdditionalPayment ? 'payment' : 'refund',
  };
}

function toOrderClaimProductViewModel(
  item: OrderItemDTO,
  product: Product,
): OrderClaimProductViewModel {
  return {
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    quantity: item.quantity,
    lineTotalText: formatKoreanMoney(item.line_total_amount),
  };
}

function toOrderClaimExchangeProductViewModel(
  item: OrderItemDTO,
  product: Product,
  variantId: string,
): OrderClaimProductViewModel {
  const variant = product.variants.find(current => current.id === variantId);
  const color = toProductColorViewModels([product])[0];

  if (!variant || !color) {
    throw new Error(`Invalid exchange product option: ${product.id}/${variantId}`);
  }

  const isSameProduct = product.id === item.product_id;
  const orderedColorLabel = item.option_label.split('/').at(0)?.trim();

  return {
    product: toProductCardViewModel(product),
    productName: isSameProduct ? item.product_name : product.name,
    optionLabel: `${isSameProduct ? (orderedColorLabel ?? color.label) : color.label} / ${variant.size}`,
    quantity: item.quantity,
    lineTotalText: formatKoreanMoney(
      (product.price + variant.price_offset) * item.quantity,
    ),
  };
}

function getOrderClaimCurrentHistoryEvent(
  claim: OrderClaimDTO,
): OrderClaimHistoryEvent {
  if (
    claim.progress_stage &&
    isOrderClaimProgressStageForType(claim.claim_type, claim.progress_stage)
  ) {
    return claim.progress_stage;
  }

  if (
    claim.status === 'completed' ||
    claim.status === 'rejected' ||
    claim.status === 'cancelled'
  ) {
    return claim.status;
  }

  return 'requested';
}

function toOrderClaimHistoryViewModel(
  history: OrderClaimHistoryDTO,
  currentEvent: OrderClaimHistoryEvent,
): OrderClaimHistoryViewModel {
  return {
    id: history.id,
    label: ORDER_CLAIM_HISTORY_EVENT_LABEL[history.event],
    occurredAt: formatKoreanShortDateTime(history.occurred_at),
    isCurrent: history.event === currentEvent,
  };
}

export function toOrderClaimRequestViewModel({
  order,
  item,
  product,
  groupProducts,
  unavailableReason,
}: {
  order: OrderDTO;
  item: OrderItemDTO;
  product: Product;
  groupProducts: Product[];
  unavailableReason: OrderClaimRequestUnavailableReason | null;
}): OrderClaimRequestViewModel {
  const productColors = toProductColorViewModels(groupProducts);

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    orderedAt: formatKoreanDate(order.ordered_at),
    orderItemId: item.id,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    quantity: item.quantity,
    itemAmount: item.line_total_amount,
    itemAmountText: formatKoreanMoney(item.line_total_amount),
    collectionAddressText: order.shipping_address_text,
    isEligible: unavailableReason === null,
    unavailableReason,
    currentProductId: product.id,
    currentVariantId: item.variant_id,
    currentVariantLabel:
      product.variants.find(variant => variant.id === item.variant_id)?.size ??
      item.option_label.split('/').at(-1)?.trim() ??
      '',
    exchangeColorOptions: groupProducts.map(productItem => {
      const color = productColors.find(
        productColor => productColor.id === productItem.id,
      );

      return {
        productId: productItem.id,
        label: color?.label ?? '기본',
        hex: color?.hex ?? '#000000',
        variants: productItem.variants.map(variant => ({
          id: variant.id,
          label: variant.size,
          isAvailable: variant.stock > 0,
          isExchangeable: hasSameOrderClaimExchangeOptionPrice({
            currentUnitAmount: item.unit_price,
            targetUnitAmount: productItem.price + variant.price_offset,
          }),
          stock: variant.stock,
        })),
      };
    }),
  };
}
