import {
  getRecentProductItems,
  getWishlistProductItems,
} from '@/domains/activity';
import {
  getMembershipViewModel,
  getUserCouponItems,
  pointTransactionRepository,
  toPointPageViewModel,
} from '@/domains/benefit';
import {
  currentUserRepository,
  userAddressRepository,
} from '@/domains/member';
import {
  filterOrders,
  getOrderItemsByUserId,
  orderRepository,
  toOrderStatusViewModel,
} from '@/domains/order';
import { buildQueryHref } from '@/shared/lib/query';
import type {
  DashboardOrderAction,
  DashboardOrderActions,
  MypageDashboardViewModel,
} from './dashboard.view-model';

function getDashboardOrderActions(
  status: Parameters<typeof toOrderStatusViewModel>[0],
): DashboardOrderActions {
  const orderAction: DashboardOrderAction = {
    type: 'order',
    label: '주문 조회',
    href: buildQueryHref('/mypage/orders', {
      period: '3-months',
      status,
      page: 1,
    }),
    variant: 'outline',
  };
  const inquiryAction: DashboardOrderAction = {
    type: 'inquiry',
    label: '1:1 문의',
    href: '/mypage/inquiries',
    variant: 'outline',
  };
  const claimHistoryAction: DashboardOrderAction = {
    type: 'claim',
    label: '교환/반품',
    href: buildQueryHref('/mypage/returns', {
      type: 'all',
      status: 'all',
      page: 1,
    }),
    variant: 'outline',
  };

  if (status === 'delivered') {
    return {
      primary: {
        type: 'review',
        label: '리뷰 관리',
        href: buildQueryHref('/mypage/reviews', {
          tab: 'available',
          page: 1,
        }),
        variant: 'outline',
      },
      secondary: claimHistoryAction,
      more: [
        { ...orderAction, variant: 'menu' },
        { ...inquiryAction, variant: 'menu' },
      ],
    };
  }

  if (status === 'cancelled') {
    return {
      primary: orderAction,
      secondary: claimHistoryAction,
      more: [{ ...inquiryAction, variant: 'menu' }],
    };
  }

  return {
    primary: orderAction,
    secondary: inquiryAction,
    more: [{ ...claimHistoryAction, variant: 'menu' }],
  };
}

export async function getMypageDashboardViewModel(): Promise<MypageDashboardViewModel | null> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return null;

  const [
    defaultAddress,
    membership,
    pointTransactions,
    coupons,
    orderRows,
    orders,
    recentProducts,
    wishlistProducts,
  ] = await Promise.all([
    userAddressRepository.findDefaultByUserId(user.id),
    getMembershipViewModel(user.id),
    pointTransactionRepository.findByUserId(user.id),
    getUserCouponItems(user.id),
    orderRepository.findByUserId(user.id),
    getOrderItemsByUserId(user.id),
    getRecentProductItems(user.id),
    getWishlistProductItems(user.id),
  ]);

  const activeStatuses = [
    'pending_payment',
    'payment_completed',
    'preparing_shipment',
    'shipping',
    'delivered',
  ] as const;
  const recentOrderIds = new Set(
    filterOrders(
      orderRows,
      { period: '3-months', status: 'all' },
      new Date(),
    ).map(order => order.id),
  );
  const recentPeriodOrders = orders.filter(order =>
    recentOrderIds.has(order.id),
  );

  return {
    summary: {
      memberName: user.name,
      defaultAddressText: defaultAddress
        ? [defaultAddress.address_line_1, defaultAddress.address_line_2]
            .filter(Boolean)
            .join(' ')
        : '등록된 배송지 없음',
      membershipTierName: membership?.currentTierName ?? '브론즈',
      pointBalanceText: toPointPageViewModel(pointTransactions, {
        type: 'all',
        page: 1,
      }).balanceText,
      availableCouponCount: coupons.filter(
        coupon => coupon.statusCode === 'available',
      ).length,
    },
    orderStatuses: activeStatuses.map(status => ({
      status,
      label: toOrderStatusViewModel(status).label,
      count: recentPeriodOrders.filter(order => order.statusCode === status)
        .length,
    })),
    recentOrders: recentPeriodOrders.map(order => ({
      ...order,
      actions: getDashboardOrderActions(order.statusCode),
    })),
    recentProducts: recentProducts.slice(0, 7),
    wishlistProducts: wishlistProducts.slice(0, 5),
  };
}
