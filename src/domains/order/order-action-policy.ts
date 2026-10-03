import type { OrderStatus } from './dto';
import type { OrderItemActionViewModel, OrderItemActionsViewModel } from './view-model';

interface OrderItemActionPolicyInput {
  status: OrderStatus;
  canRepurchase: boolean;
  deliveredAt: string | null;
  reviewWritable?: boolean;
}

const inquiry: OrderItemActionViewModel = { type: 'inquiry', label: '1:1 문의' };
const receipt: OrderItemActionViewModel = { type: 'receipt', label: '영수증' };
const cancel: OrderItemActionViewModel = { type: 'cancel', label: '주문 취소' };
const claim: OrderItemActionViewModel = { type: 'claim', label: '교환·반품' };
const review: OrderItemActionViewModel = { type: 'review', label: '리뷰 쓰기' };
const repurchase: OrderItemActionViewModel = { type: 'repurchase', label: '다시 담기' };

/**
 * 상품 하나에 표시할 주문 후속 액션의 위치를 결정한다.
 * 주문 상세 이동은 주문 카드 헤더에서 제공하므로 상품 액션에는 포함하지 않는다.
 */
export function getOrderItemActionPolicy({
  status,
  canRepurchase,
  deliveredAt,
  reviewWritable: reviewWritableOverride,
}: OrderItemActionPolicyInput): OrderItemActionsViewModel | null {
  if (status === 'cancelled') {
    return null;
  }

  if (status === 'pending_payment') {
    return { primary: cancel, secondary: inquiry, more: [] };
  }

  if (status === 'payment_completed') {
    return { primary: cancel, secondary: inquiry, more: [receipt] };
  }

  if (status === 'shipping') {
    return { primary: inquiry, secondary: null, more: [receipt] };
  }

  if (status === 'delivered') {
    const reviewWritable = reviewWritableOverride ?? (deliveredAt
      ? isOrderReviewPeriodActive(deliveredAt)
      : false);

    if (reviewWritable) {
      return {
        primary: review,
        secondary: claim,
        more: [
          ...(canRepurchase ? [repurchase] : []),
          inquiry,
          receipt,
        ],
      };
    }

    const primary = canRepurchase ? repurchase : inquiry;
    return {
      primary,
      secondary: claim,
      more: [
        ...(primary.type === 'repurchase' ? [inquiry] : []),
        receipt,
      ],
    };
  }

  return null;
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
