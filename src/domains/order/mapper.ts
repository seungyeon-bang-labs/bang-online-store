import {
  formatKoreanDate,
  formatKoreanDateTime,
  formatKoreanMoney,
} from '@/shared/lib/format';
import type { StatusViewModel } from '@/shared/types/status';
import { toProductCardViewModel, type Product } from '@/domains/product';
import type {
  OrderDTO,
  OrderItemCancellationDTO,
  OrderItemDTO,
  OrderStatus,
  OrderStatusHistoryDTO,
  OrderStatusHistoryStatus,
} from './dto';
import type {
  OrderDetailItemViewModel,
  OrderDetailViewModel,
  OrderItemActionsViewModel,
  OrderItemViewModel,
  OrderListItemViewModel,
  OrderRefundViewModel,
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

export function getOrderStatusDescription(order: OrderDTO): string {
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

const ORDER_STATUS_HISTORY_LABELS: Record<
  OrderStatusHistoryStatus,
  string
> = {
  order_received: '주문 접수',
  pending_payment: '입금 대기',
  payment_completed: '결제 완료',
  preparing_shipment: '배송 준비',
  shipping: '배송 시작',
  delivered: '배송 완료',
  cancelled: '주문 취소',
};

function getOrderItemActions(
  status: OrderStatus,
  canRepurchase: boolean,
): OrderItemActionsViewModel {
  if (status === 'pending_payment') {
    return {
      primary: { type: 'payment', label: '입금 정보' },
      secondary: { type: 'cancel', label: '주문 취소' },
      more: [{ type: 'inquiry', label: '1:1 문의' }],
    };
  }

  if (status === 'payment_completed' || status === 'preparing_shipment') {
    return {
      primary: { type: 'cancel', label: '주문 취소' },
      secondary: { type: 'inquiry', label: '1:1 문의' },
      more: [{ type: 'receipt', label: '영수증' }],
    };
  }

  if (status === 'shipping') {
    return {
      primary: { type: 'tracking', label: '배송 조회' },
      secondary: { type: 'inquiry', label: '1:1 문의' },
      more: [{ type: 'receipt', label: '영수증' }],
    };
  }

  if (status === 'delivered') {
    return {
      primary: { type: 'review', label: '리뷰 쓰기' },
      secondary: { type: 'claim', label: '교환·반품' },
      more: canRepurchase
        ? [{ type: 'repurchase', label: '다시 담기' }]
        : [{ type: 'inquiry', label: '1:1 문의' }],
    };
  }

  return {
    primary: {
      type: canRepurchase ? 'repurchase' : 'inquiry',
      label: canRepurchase ? '다시 담기' : '1:1 문의',
    },
    secondary: { type: 'refund', label: '환불 상세' },
    more: [{ type: 'inquiry', label: '주문 문의' }],
  };
}

interface OrderItemViewModelParts {
  detailItem: OrderDetailItemViewModel;
  repurchaseItem: OrderItemViewModel['repurchaseItem'];
}

function toOrderItemViewModelParts(
  order: OrderDTO,
  item: OrderItemDTO,
  product: Product,
  cancellation: OrderItemCancellationDTO | null,
): OrderItemViewModelParts {
  const orderedVariant = product.variants.find(
    variant => variant.id === item.variant_id,
  );
  const canRepurchase =
    product.state === 'active' &&
    orderedVariant !== undefined &&
    orderedVariant.stock >= item.quantity;

  const repurchaseItem = canRepurchase
    ? {
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
      }
    : null;

  return {
    detailItem: {
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
      actions: cancellation
        ? null
        : getOrderItemActions(order.status, canRepurchase),
      repurchaseItem,
    },
    repurchaseItem,
  };
}

function toOrderRefundViewModels(
  joinedItems: readonly {
    cancellation: OrderItemCancellationDTO | null;
  }[],
): OrderRefundViewModel[] {
  return joinedItems.flatMap(({ cancellation }) => {
    if (!cancellation) return [];

    const isPending = cancellation.refund_status === 'pending';
    const refundDate = isPending
      ? cancellation.refund_expected_at
      : cancellation.refunded_at;

    return [
      {
        id: cancellation.id,
        label: isPending ? '환불 예정 금액' : '환불 완료 금액',
        amountText: formatKoreanMoney(cancellation.refund_amount),
        description: refundDate
          ? `${formatKoreanDate(refundDate)} ${isPending ? '이내 ' : ''}결제수단으로 환불 ${
              isPending ? '예정' : '완료'
            }`
          : `결제수단으로 환불 ${isPending ? '예정' : '완료'}`,
        status: cancellation.refund_status,
      },
    ];
  });
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

  const refunds = toOrderRefundViewModels(joinedItems);

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
    refunds,
    items: joinedItems.map(({ item, product, cancellation }) => {
      const { detailItem, repurchaseItem } = toOrderItemViewModelParts(
        order,
        item,
        product,
        cancellation,
      );

      return {
        ...detailItem,
        repurchaseItem,
      };
    }),
  };
}

export function toOrderDetailViewModel(
  order: OrderDTO,
  joinedItems: Array<{
    item: OrderItemDTO;
    product: Product;
    cancellation: OrderItemCancellationDTO | null;
  }>,
  histories: readonly OrderStatusHistoryDTO[],
): OrderDetailViewModel {
  const refunds = toOrderRefundViewModels(joinedItems);
  const completedRefundAmount = joinedItems.reduce(
    (total, { cancellation }) =>
      total +
      (cancellation?.refund_status === 'completed'
        ? cancellation.refund_amount
        : 0),
    0,
  );

  return {
    id: order.id,
    orderNumber: order.order_number,
    orderedAt: formatKoreanDate(order.ordered_at),
    paidAt: order.paid_at ? formatKoreanDateTime(order.paid_at) : null,
    items: joinedItems.map(({ item, product, cancellation }) =>
      toOrderItemViewModelParts(order, item, product, cancellation).detailItem,
    ),
    payment: {
      subtotalAmountText: formatKoreanMoney(order.subtotal_amount),
      discountAmountText: formatKoreanMoney(order.discount_amount),
      hasDiscount: order.discount_amount > 0,
      shippingFeeText: formatKoreanMoney(order.shipping_fee),
      isFreeShipping: order.shipping_fee === 0,
      totalAmountText: formatKoreanMoney(order.total_amount),
      paymentMethod: order.payment_method,
    },
    shipping: {
      recipientName: order.recipient_name,
      recipientPhone: order.recipient_phone,
      addressText: order.shipping_address_text,
      postalCode: order.postal_code,
    },
    refund: {
      items: refunds,
      finalPaymentAmountText:
        completedRefundAmount > 0
          ? formatKoreanMoney(order.total_amount - completedRefundAmount)
          : null,
    },
    statusHistory: histories
      .slice()
      .sort(
        (a, b) =>
          new Date(a.occurred_at).getTime() -
          new Date(b.occurred_at).getTime(),
      )
      .map(history => ({
        id: history.id,
        label: ORDER_STATUS_HISTORY_LABELS[history.status],
        occurredAt: formatKoreanDateTime(history.occurred_at),
        isCurrent: history.status === order.status,
      })),
  };
}
