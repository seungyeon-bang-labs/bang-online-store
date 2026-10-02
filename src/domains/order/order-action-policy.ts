import type { OrderStatus } from './dto';
import type { OrderItemActionViewModel, OrderItemActionsViewModel } from './view-model';

interface OrderItemActionPolicyInput {
  status: OrderStatus;
  canRepurchase: boolean;
  deliveredAt: string | null;
  reviewWritable?: boolean;
}

const order: OrderItemActionViewModel = { type: 'order', label: '주문 상세' };
const inquiry: OrderItemActionViewModel = { type: 'inquiry', label: '1:1 문의' };
const receipt: OrderItemActionViewModel = { type: 'receipt', label: '영수증' };
const cancel: OrderItemActionViewModel = { type: 'cancel', label: '주문 취소' };
const claim: OrderItemActionViewModel = { type: 'claim', label: '교환·반품' };
const review: OrderItemActionViewModel = { type: 'review', label: '리뷰 쓰기' };
const repurchase: OrderItemActionViewModel = { type: 'repurchase', label: '다시 담기' };

/**
 * 상품 하나에 표시할 주문 후속 액션의 위치를 결정한다.
 * 주문 상세는 사용자가 예측할 수 있도록 항상 오른쪽 주 버튼으로 둔다.
 */
export function getOrderItemActionPolicy({
  status,
  canRepurchase,
  deliveredAt,
  reviewWritable: reviewWritableOverride,
}: OrderItemActionPolicyInput): OrderItemActionsViewModel {
  if (status === 'pending_payment') {
    return { primary: cancel, secondary: order, more: [inquiry] };
  }

  if (status === 'payment_completed') {
    return { primary: cancel, secondary: order, more: [inquiry, receipt] };
  }

  if (status === 'shipping') {
    return { primary: inquiry, secondary: order, more: [receipt] };
  }

  if (status === 'delivered') {
    const reviewWritable = reviewWritableOverride ?? (deliveredAt
      ? isOrderReviewPeriodActive(deliveredAt)
      : false);
    const primary = reviewWritable ? review : canRepurchase ? repurchase : inquiry;
    return {
      primary,
      secondary: order,
      more: [inquiry, receipt, claim],
    };
  }

  return {
    primary: canRepurchase ? repurchase : inquiry,
    secondary: order,
    more: [inquiry, receipt],
  };
}

export function isOrderReviewPeriodActive(
  deliveredAt: string,
  now: Date = new Date(),
): boolean {
  const deadline = new Date(deliveredAt);
  deadline.setDate(deadline.getDate() + 30);
  deadline.setHours(23, 59, 59, 999);
  return deadline >= now;
}
