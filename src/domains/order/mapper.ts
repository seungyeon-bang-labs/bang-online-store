import {
  formatKoreanDate,
  formatKoreanDateTime,
  formatKoreanMoney,
  formatKoreanShortDateTime,
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
  OrderItemViewModel,
  OrderAmountViewModel,
  OrderListItemViewModel,
  OrderListPageViewModel,
  OrderRefundViewModel,
} from './view-model';
import { getOrderItemActionPolicy } from './order-action-policy';

const ORDER_STATUS_VIEW: Record<OrderStatus, StatusViewModel> = {
  pending_payment: { label: '입금대기', tone: 'warning' },
  payment_completed: { label: '결제완료', tone: 'info' },
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
    order.status === 'shipping' && order.estimated_delivery_at
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
  pending_payment: '입금 대기',
  payment_completed: '결제 완료',
  shipping: '배송 시작',
  delivered: '배송 완료',
  cancelled: '주문 취소',
};

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
          reason: cancellation.reason,
          reasonDetail: cancellation.reason_detail,
          refundAmountLabel:
            cancellation.refund_status === 'pending'
              ? '환불 예정 금액'
              : '환불 완료 금액',
          refundAmountText: formatKoreanMoney(cancellation.refund_amount),
          }
        : null,
      actions: cancellation
        ? null
        : getOrderItemActionPolicy({
            status: order.status,
            canRepurchase,
            deliveredAt: order.delivered_at,
          }),
      repurchaseItem,
    },
    repurchaseItem,
  };
}

function toOrderRefundViewModels(
  joinedItems: readonly {
    cancellation: OrderItemCancellationDTO | null;
  }[],
  paymentMethod: OrderDTO['payment_method'],
): OrderRefundViewModel[] {
  const paymentMethodText =
    paymentMethod === '신용카드' ? '신용카드로' : `${paymentMethod}으로`;

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
          ? `${formatKoreanDate(refundDate)} ${isPending ? '이내 ' : ''}${paymentMethodText} 환불 ${
              isPending ? '예정' : '완료'
            }`
          : `${paymentMethodText} 환불 ${isPending ? '예정' : '완료'}`,
        status: cancellation.refund_status,
      },
    ];
  });
}

function toOrderAmountViewModel(
  order: OrderDTO,
  hasCancellation: boolean,
): OrderAmountViewModel {
  return {
    label:
      order.status === 'pending_payment'
        ? '결제 예정 금액'
        : hasCancellation
          ? '최초 결제 금액'
          : '결제 금액',
    amountText: formatKoreanMoney(order.total_amount),
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
  const refunds = toOrderRefundViewModels(joinedItems, order.payment_method);
  const cancelledItemCount = joinedItems.filter(
    ({ cancellation }) => cancellation !== null,
  ).length;

  return {
    id: order.id,
    orderNumber: order.order_number,
    orderedAt: formatKoreanDate(order.ordered_at),
    statusCode: order.status,
    status: toOrderStatusViewModel(order.status),
    statusDescription: getOrderStatusDescription(order),
    orderAmount: toOrderAmountViewModel(order, cancelledItemCount > 0),
    cancelledItemCount,
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

/** 이미 리뷰를 작성한 상품은 리뷰 기간과 무관하게 다시 담기 정책을 적용한다. */
export function applyReviewedItemActions(
  page: OrderListPageViewModel,
  reviewedOrderItemIds: ReadonlySet<string>,
): OrderListPageViewModel {
  return {
    ...page,
    items: page.items.map(order => ({
      ...order,
      items: order.items.map(item => {
        if (
          order.statusCode !== 'delivered' ||
          item.cancellation ||
          !reviewedOrderItemIds.has(item.id)
        ) {
          return item;
        }

        return {
          ...item,
          actions: getOrderItemActionPolicy({
            status: order.statusCode,
            canRepurchase: item.repurchaseItem !== null,
            deliveredAt: null,
            reviewWritable: false,
          }),
        };
      }),
    })),
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
  const refunds = toOrderRefundViewModels(joinedItems, order.payment_method);
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
      totalAmountLabel:
        refunds.length > 0 ? '최초 결제 금액' : '총 결제 금액',
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
        occurredAt: formatKoreanShortDateTime(history.occurred_at),
        isCurrent: history.status === order.status,
      })),
  };
}
