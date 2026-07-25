import type { ActivityProductViewModel } from '@/domains/activity/view-model';
import type { OrderStatus } from '@/domains/order/dto';
import type { OrderListItemViewModel } from '@/domains/order/view-model';

export type MypageHomeOrderActionType =
  | 'order'
  | 'payment'
  | 'cancel'
  | 'tracking'
  | 'review'
  | 'claim'
  | 'repurchase'
  | 'refund'
  | 'receipt'
  | 'inquiry';

interface MypageHomeOrderActionBase {
  type: MypageHomeOrderActionType;
  label: string;
}

export interface MypageHomeOrderLinkAction
  extends MypageHomeOrderActionBase {
  behavior: 'link';
  href: string;
}

export interface MypageHomeOrderCommandAction
  extends MypageHomeOrderActionBase {
  behavior: 'command';
  type: 'repurchase';
  cartItem: {
    productId: number;
    variantId: string;
    quantity: number;
  };
}

export interface MypageHomeOrderPlaceholderAction
  extends MypageHomeOrderActionBase {
  behavior: 'placeholder';
}

export type MypageHomeOrderAction =
  | MypageHomeOrderLinkAction
  | MypageHomeOrderCommandAction
  | MypageHomeOrderPlaceholderAction;

export interface MypageHomeOrderActions {
  primary: MypageHomeOrderAction | null;
  secondary: MypageHomeOrderAction | null;
  more: MypageHomeOrderAction[];
}

export type MypageHomeReviewState =
  | 'writable'
  | 'written'
  | 'unavailable';

export interface MypageHomeRecentOrderViewModel
  extends OrderListItemViewModel {
  productSummary: string;
  orderHref: string;
  actions: MypageHomeOrderActions;
  statusDescription: string;
}

export interface MypageHomeSummaryViewModel {
  memberName: string;
  defaultAddressText: string;
  membershipTierName: string;
  pointBalanceText: string;
  availableCouponCount: number;
}

export interface MypageHomeOrderStatusViewModel {
  status: Exclude<OrderStatus, 'cancelled'>;
  label: string;
  count: number;
}

export interface MypageHomeViewModel {
  summary: MypageHomeSummaryViewModel;
  orderStatuses: MypageHomeOrderStatusViewModel[];
  recentOrders: MypageHomeRecentOrderViewModel[];
  recentProducts: ActivityProductViewModel[];
  wishlistProducts: ActivityProductViewModel[];
}
