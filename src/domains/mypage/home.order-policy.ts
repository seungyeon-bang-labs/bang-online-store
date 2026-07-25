import type { OrderStatus } from '../order/dto';
import { formatKoreanDate } from '@/shared/lib/format';
import type {
  MypageHomeOrderAction,
  MypageHomeOrderActions,
  MypageHomeReviewState,
} from './home.view-model';

export interface MypageHomeOrderActionLinks {
  payment: MypageHomeOrderActionTarget;
  cancel: MypageHomeOrderActionTarget;
  order: MypageHomeOrderActionTarget;
  tracking: MypageHomeOrderActionTarget;
  reviewWrite: MypageHomeOrderActionTarget;
  reviewEdit: MypageHomeOrderActionTarget;
  claim: MypageHomeOrderActionTarget;
  receipt: MypageHomeOrderActionTarget;
  refund: MypageHomeOrderActionTarget;
  inquiry: MypageHomeOrderActionTarget;
}

type MypageHomeOrderActionTarget = string | null;

interface RepurchaseItem {
  productId: number;
  variantId: string;
  quantity: number;
}

interface MypageHomeOrderActionPolicyInput {
  status: OrderStatus;
  reviewState: MypageHomeReviewState;
  itemCount: number;
  canCancel: boolean;
  canClaim: boolean;
  repurchaseItem: RepurchaseItem | null;
  links: MypageHomeOrderActionLinks;
}

interface MypageHomeOrderStatusDescriptionInput {
  status: OrderStatus;
  orderedAt: string;
  paymentDueAt: string | null;
  paidAt: string | null;
  estimatedDeliveryAt: string | null;
  cancelledAt: string | null;
  paymentMethod: string;
}

function createNavigationAction(
  type: MypageHomeOrderAction['type'],
  label: string,
  target: MypageHomeOrderActionTarget,
): MypageHomeOrderAction | null {
  if (!target) return null;

  if (target === 'placeholder') {
    return {
      behavior: 'placeholder',
      type,
      label,
    };
  }

  return {
    behavior: 'link',
    type,
    label,
    href: target,
  };
}

function createRepurchaseAction(
  item: RepurchaseItem | null,
): MypageHomeOrderAction | null {
  if (!item) return null;

  return {
    behavior: 'command',
    type: 'repurchase',
    label: '다시 담기',
    cartItem: item,
  };
}

function arrangeActions(
  primaryCandidates: Array<MypageHomeOrderAction | null>,
  secondaryCandidates: Array<MypageHomeOrderAction | null>,
  moreCandidates: Array<MypageHomeOrderAction | null>,
): MypageHomeOrderActions {
  const usedTypes = new Set<MypageHomeOrderAction['type']>();

  const takeFirst = (
    candidates: Array<MypageHomeOrderAction | null>,
  ): MypageHomeOrderAction | null => {
    const action = candidates.find(
      candidate => candidate && !usedTypes.has(candidate.type),
    );
    if (!action) return null;
    usedTypes.add(action.type);
    return action;
  };

  const primary = takeFirst(primaryCandidates);
  const secondary = takeFirst(secondaryCandidates);
  const more = moreCandidates.filter(
    (action): action is MypageHomeOrderAction => {
      if (!action || usedTypes.has(action.type)) return false;
      usedTypes.add(action.type);
      return true;
    },
  );

  return {
    primary,
    secondary,
    more,
  };
}

export function buildMypageHomeOrderActions({
  status,
  reviewState,
  itemCount,
  canCancel,
  canClaim,
  repurchaseItem,
  links,
}: MypageHomeOrderActionPolicyInput): MypageHomeOrderActions {
  const payment = createNavigationAction(
    'payment',
    '입금 정보',
    links.payment,
  );
  const cancel = canCancel
    ? createNavigationAction('cancel', '주문 취소', links.cancel)
    : null;
  const order = createNavigationAction('order', '주문상세', links.order);
  const tracking = createNavigationAction(
    'tracking',
    '배송조회',
    links.tracking,
  );
  const reviewWrite = createNavigationAction(
    'review',
    '리뷰 쓰기',
    links.reviewWrite,
  );
  const reviewEdit = createNavigationAction(
    'review',
    '리뷰 수정',
    links.reviewEdit,
  );
  const claim = canClaim
    ? createNavigationAction('claim', '교환/반품', links.claim)
    : null;
  const repurchase =
    itemCount === 1 ? createRepurchaseAction(repurchaseItem) : null;
  const receipt = createNavigationAction(
    'receipt',
    '영수증',
    links.receipt,
  );
  const refund = createNavigationAction(
    'refund',
    '환불 상세',
    links.refund,
  );
  const inquiry = createNavigationAction(
    'inquiry',
    '1:1 문의',
    links.inquiry,
  );

  if (status === 'pending_payment') {
    return arrangeActions(
      [payment, order, inquiry],
      [cancel, order, inquiry],
      [order, inquiry],
    );
  }

  if (
    status === 'payment_completed' ||
    status === 'preparing_shipment'
  ) {
    return arrangeActions(
      [order, inquiry],
      [cancel, inquiry, receipt],
      [receipt, inquiry],
    );
  }

  if (status === 'shipping') {
    return arrangeActions(
      [tracking, order, inquiry],
      [order, inquiry, receipt],
      [receipt, inquiry],
    );
  }

  if (status === 'delivered') {
    if (reviewState === 'writable') {
      return arrangeActions(
        [reviewWrite, claim, repurchase, order, inquiry],
        [claim, repurchase, order, inquiry],
        [repurchase, order, receipt, inquiry],
      );
    }

    if (reviewState === 'written') {
      return arrangeActions(
        [reviewEdit, repurchase, order, inquiry],
        [repurchase, order, claim, inquiry],
        [claim, order, receipt, inquiry],
      );
    }

    return arrangeActions(
      [claim, repurchase, order, inquiry],
      [repurchase, order, inquiry, receipt],
      [order, receipt, inquiry],
    );
  }

  return arrangeActions(
    [refund, repurchase, order, inquiry],
    [repurchase, order, inquiry],
    [order, inquiry],
  );
}

export function getMypageHomeOrderStatusDescription({
  status,
  orderedAt,
  paymentDueAt,
  paidAt,
  estimatedDeliveryAt,
  cancelledAt,
  paymentMethod,
}: MypageHomeOrderStatusDescriptionInput): string {
  if (status === 'pending_payment' && paymentDueAt) {
    return `${formatKoreanDate(paymentDueAt)}까지 입금`;
  }

  if (status === 'payment_completed' && paidAt) {
    const completedLabel =
      paymentMethod === '무통장 입금' ? '입금 완료' : '결제 완료';
    return `${formatKoreanDate(paidAt)} ${completedLabel}`;
  }

  if (
    (status === 'preparing_shipment' || status === 'shipping') &&
    estimatedDeliveryAt
  ) {
    return `${formatKoreanDate(estimatedDeliveryAt)} 도착 예정`;
  }

  if (status === 'cancelled' && cancelledAt) {
    return `${formatKoreanDate(cancelledAt)} 취소 완료`;
  }

  return `${formatKoreanDate(orderedAt)} 주문`;
}
