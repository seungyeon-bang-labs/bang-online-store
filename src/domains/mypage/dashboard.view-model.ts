import type { ActivityProductViewModel } from '@/domains/activity/activity.view-model';
import type { OrderStatus } from '@/domains/order/order.dto';
import type { OrderListItemViewModel } from '@/domains/order/order.view-model';

export type DashboardOrderActionType =
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

export interface DashboardOrderAction {
  type: DashboardOrderActionType;
  label: string;
  href: string;
  variant: 'primary' | 'outline' | 'menu';
}

export interface DashboardOrderActions {
  primary: DashboardOrderAction | null;
  secondary: DashboardOrderAction | null;
  more: DashboardOrderAction[];
}

export interface DashboardRecentOrderViewModel
  extends OrderListItemViewModel {
  actions: DashboardOrderActions;
}

export interface MypageDashboardViewModel {
  summary: {
    memberName: string;
    defaultAddressText: string;
    membershipTierName: string;
    pointBalanceText: string;
    availableCouponCount: number;
  };
  orderStatuses: Array<{
    status: Exclude<OrderStatus, 'cancelled'>;
    label: string;
    count: number;
  }>;
  recentOrders: DashboardRecentOrderViewModel[];
  recentProducts: ActivityProductViewModel[];
  wishlistProducts: ActivityProductViewModel[];
}
