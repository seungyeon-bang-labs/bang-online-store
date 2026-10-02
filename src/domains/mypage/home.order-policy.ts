import type { OrderStatus } from '../order/dto';
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

function placeActions(
  primary: MypageHomeOrderAction | null,
  order: MypageHomeOrderAction | null,
  moreCandidates: Array<MypageHomeOrderAction | null>,
): MypageHomeOrderActions {
  const usedTypes = new Set(
    [primary, order].flatMap(action => (action ? [action.type] : [])),
  );

  return {
    primary,
    secondary: order,
    more: moreCandidates.filter((action): action is MypageHomeOrderAction => {
      if (!action || usedTypes.has(action.type)) return false;
      usedTypes.add(action.type);
      return true;
    }),
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
  const cancel = canCancel
    ? createNavigationAction('cancel', '주문 취소', links.cancel)
    : null;
  const order = createNavigationAction('order', '주문상세', links.order);
  const reviewWrite = createNavigationAction(
    'review',
    '리뷰 쓰기',
    links.reviewWrite,
  );
  const claim = canClaim
    ? createNavigationAction('claim', '교환·반품', links.claim)
    : null;
  const repurchase =
    itemCount === 1 ? createRepurchaseAction(repurchaseItem) : null;
  const receipt = createNavigationAction(
    'receipt',
    '영수증',
    links.receipt,
  );
  const inquiry = createNavigationAction(
    'inquiry',
    '1:1 문의',
    links.inquiry,
  );

  if (itemCount > 1) {
    return placeActions(inquiry, order, status === 'pending_payment' ? [] : [receipt]);
  }

  if (status === 'pending_payment') {
    return placeActions(cancel, order, [inquiry]);
  }

  if (status === 'payment_completed') {
    return placeActions(cancel, order, [inquiry, receipt]);
  }

  if (status === 'shipping') {
    return placeActions(inquiry, order, [receipt]);
  }

  if (status === 'delivered') {
    if (reviewState === 'writable') {
      return placeActions(reviewWrite, order, [inquiry, receipt, claim, repurchase]);
    }

    return placeActions(repurchase ?? inquiry, order, [inquiry, receipt, claim]);
  }

  return placeActions(repurchase ?? inquiry, order, [inquiry, receipt]);
}
