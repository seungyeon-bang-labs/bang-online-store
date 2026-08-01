import {
  formatKoreanDate,
  formatKoreanMoney,
} from '@/shared/lib/format';
import type { StatusViewModel } from '@/shared/types/status';
import { toProductCardViewModel, type Product } from '@/domains/product';
import type {
  OrderClaimDTO,
  OrderClaimStatus,
  OrderClaimType,
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
  OrderStatus,
} from './dto';
import type {
  OrderClaimViewModel,
  OrderItemActionsViewModel,
  OrderListItemViewModel,
} from './view-model';

const ORDER_STATUS_VIEW: Record<OrderStatus, StatusViewModel> = {
  pending_payment: { label: '입금대기', tone: 'warning' },
  payment_completed: { label: '결제완료', tone: 'info' },
  preparing_shipment: { label: '배송준비', tone: 'info' },
  shipping: { label: '배송중', tone: 'info' },
  delivered: { label: '배송완료', tone: 'success' },
  cancelled: { label: '주문취소', tone: 'danger' },
};

export const toOrderStatusViewModel = (
  status: OrderStatus,
): StatusViewModel => ORDER_STATUS_VIEW[status];

function getOrderStatusDescription(order: OrderDTO): string {
  if (order.status === 'pending_payment' && order.payment_due_at) {
    return `${formatKoreanDate(order.payment_due_at)}까지 입금`;
  }

  if (order.status === 'payment_completed' && order.paid_at) {
    const completedLabel =
      order.payment_method === '무통장 입금' ? '입금 완료' : '결제 완료';
    return `${formatKoreanDate(order.paid_at)} ${completedLabel}`;
  }

  if (
    (order.status === 'preparing_shipment' || order.status === 'shipping') &&
    order.estimated_delivery_at
  ) {
    return `${formatKoreanDate(order.estimated_delivery_at)} 도착 예정`;
  }

  if (order.status === 'cancelled' && order.cancelled_at) {
    return `${formatKoreanDate(order.cancelled_at)} 취소 완료`;
  }

  return `${formatKoreanDate(order.ordered_at)} 주문`;
}

const ORDER_CLAIM_TYPE_VIEW: Record<OrderClaimType, StatusViewModel> = {
  exchange: { label: '교환', tone: 'info' },
  return: { label: '반품', tone: 'warning' },
};

const ORDER_CLAIM_STATUS_VIEW: Record<OrderClaimStatus, StatusViewModel> = {
  requested: { label: '신청', tone: 'warning' },
  processing: { label: '처리중', tone: 'info' },
  completed: { label: '처리완료', tone: 'success' },
  rejected: { label: '반려', tone: 'danger' },
};

export const toOrderClaimTypeViewModel = (
  type: OrderClaimType,
): StatusViewModel => ORDER_CLAIM_TYPE_VIEW[type];

export const toOrderClaimStatusViewModel = (
  status: OrderClaimStatus,
): StatusViewModel => ORDER_CLAIM_STATUS_VIEW[status];

function getOrderItemActions(
  status: OrderStatus,
  canRepurchase: boolean,
): OrderItemActionsViewModel {
  if (status === 'pending_payment') {
    return {
      primary: { label: '입금 정보' },
      secondary: { label: '주문 취소' },
      more: [{ label: '1:1 문의' }],
    };
  }

  if (status === 'payment_completed' || status === 'preparing_shipment') {
    return {
      primary: { label: '주문 취소' },
      secondary: { label: '1:1 문의' },
      more: [{ label: '영수증' }],
    };
  }

  if (status === 'shipping') {
    return {
      primary: { label: '배송 조회' },
      secondary: { label: '1:1 문의' },
      more: [{ label: '영수증' }],
    };
  }

  if (status === 'delivered') {
    return {
      primary: { label: '리뷰 쓰기' },
      secondary: { label: '교환/반품' },
      more: canRepurchase ? [{ label: '다시 담기' }] : [{ label: '1:1 문의' }],
    };
  }

  return {
    primary: { label: canRepurchase ? '다시 담기' : '1:1 문의' },
    secondary: { label: '환불 상세' },
    more: [{ label: '주문 문의' }],
  };
}

export function toOrderListItemViewModel(
  order: OrderDTO,
  joinedItems: Array<{
    item: OrderItemDTO;
    product: Product;
    cancellation: OrderItemCancellationDTO | null;
  }>,
): OrderListItemViewModel {
  const refundedAmount = joinedItems.reduce(
    (total, { cancellation }) => total + (cancellation?.refund_amount ?? 0),
    0,
  );

  return {
    id: order.id,
    orderNumber: order.order_number,
    orderedAt: formatKoreanDate(order.ordered_at),
    statusCode: order.status,
    status: toOrderStatusViewModel(order.status),
    statusDescription: getOrderStatusDescription(order),
    totalAmountText: formatKoreanMoney(order.total_amount),
    finalAmountText: formatKoreanMoney(order.total_amount - refundedAmount),
    cancelledItemCount: joinedItems.filter(
      ({ cancellation }) => cancellation !== null,
    ).length,
    refunds: joinedItems.flatMap(({ cancellation }) => {
      if (!cancellation) return [];

      const isPending = cancellation.refund_status === 'pending';
      const refundDate = isPending
        ? cancellation.refund_expected_at
        : cancellation.refunded_at;

      return {
        id: cancellation.id,
        label: isPending ? '환불 예정 금액' : '환불 완료 금액',
        amountText: formatKoreanMoney(cancellation.refund_amount),
        description: refundDate
          ? `${formatKoreanDate(refundDate)} ${isPending ? '이내 ' : ''}결제수단으로 환불 ${
              isPending ? '예정' : '완료'
            }`
          : `결제수단으로 환불 ${isPending ? '예정' : '완료'}`,
        status: cancellation.refund_status,
      };
    }),
    items: joinedItems.map(({ item, product, cancellation }) => {
      const orderedVariant = product.variants.find(
        variant => variant.id === item.variant_id,
      );
      const canRepurchase =
        product.state === 'active' &&
        orderedVariant !== undefined &&
        orderedVariant.stock >= item.quantity;

      return {
        id: item.id,
        product: toProductCardViewModel(product),
        productName: item.product_name,
        optionLabel: item.option_label,
        quantity: item.quantity,
        lineTotalText: formatKoreanMoney(item.line_total_amount),
        cancellation: cancellation
          ? {
              refundAmountText: formatKoreanMoney(cancellation.refund_amount),
            }
          : null,
        repurchaseItem: canRepurchase
          ? {
              productId: item.product_id,
              variantId: item.variant_id,
              quantity: item.quantity,
            }
          : null,
        actions: cancellation
          ? null
          : getOrderItemActions(order.status, canRepurchase),
      };
    }),
  };
}

export function toOrderClaimViewModel(
  claim: OrderClaimDTO,
  order: OrderDTO,
  item: OrderItemDTO,
  product: Product,
): OrderClaimViewModel {
  const type = toOrderClaimTypeViewModel(claim.claim_type);
  const status = toOrderClaimStatusViewModel(claim.status);

  return {
    id: claim.id,
    orderNumber: order.order_number,
    product: toProductCardViewModel(product),
    productName: item.product_name,
    optionLabel: item.option_label,
    lineTotalText: formatKoreanMoney(item.line_total_amount),
    status: {
      ...status,
      label: `${type.label} ${status.label}`,
    },
    reason: claim.reason,
    requestedAt: formatKoreanDate(claim.requested_at),
    completedAt: claim.completed_at
      ? formatKoreanDate(claim.completed_at)
      : null,
  };
}
