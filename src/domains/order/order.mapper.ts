import {
  formatMypageDate,
  formatMypageMoney,
} from '@/domains/mypage/mypage-format';
import type { StatusViewModel } from '@/domains/mypage/mypage-status.view-model';
import { toProductCardViewModel, type Product } from '@/domains/product';
import type {
  OrderClaimDTO,
  OrderClaimStatus,
  OrderClaimType,
  OrderDTO,
  OrderItemDTO,
  OrderStatus,
} from './order.dto';
import type {
  OrderClaimViewModel,
  OrderListItemViewModel,
} from './order.view-model';

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

const ORDER_CLAIM_TYPE_VIEW: Record<OrderClaimType, StatusViewModel> = {
  cancel: { label: '취소', tone: 'danger' },
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

export function toOrderListItemViewModel(
  order: OrderDTO,
  joinedItems: Array<{ item: OrderItemDTO; product: Product }>,
): OrderListItemViewModel {
  return {
    id: order.id,
    orderNumber: order.order_number,
    orderedAt: formatMypageDate(order.ordered_at),
    statusCode: order.status,
    status: toOrderStatusViewModel(order.status),
    totalAmountText: formatMypageMoney(order.total_amount),
    items: joinedItems.map(({ item, product }) => ({
      id: item.id,
      product: toProductCardViewModel(product),
      productName: item.product_name,
      optionLabel: item.option_label,
      quantity: item.quantity,
      lineTotalText: formatMypageMoney(item.line_total_amount),
    })),
  };
}

export function toOrderClaimViewModel(
  claim: OrderClaimDTO,
  order: OrderDTO,
  item: OrderItemDTO,
): OrderClaimViewModel {
  return {
    id: claim.id,
    orderNumber: order.order_number,
    productName: item.product_name,
    optionLabel: item.option_label,
    type: toOrderClaimTypeViewModel(claim.claim_type),
    status: toOrderClaimStatusViewModel(claim.status),
    reason: claim.reason,
    requestedAt: formatMypageDate(claim.requested_at),
    completedAt: claim.completed_at
      ? formatMypageDate(claim.completed_at)
      : null,
  };
}
