import type { CouponDTO } from '@/domains/coupon';
import type {
  PointTransactionDTO,
  UserCouponDTO,
  UserCouponStatus,
} from './benefit.dto';

export const POINT_TYPE_FILTERS = [
  'all',
  'earn',
  'use',
  'expire',
] as const;

export interface PointListQuery {
  type: (typeof POINT_TYPE_FILTERS)[number];
  page: number;
}

export const USER_COUPON_TABS = [
  'available',
  'used',
  'expired',
] as const;

export interface UserCouponListQuery {
  tab: (typeof USER_COUPON_TABS)[number];
  page: number;
}

export const calculatePointBalance = (
  transactions: readonly PointTransactionDTO[],
) => transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

export const calculateExpiringPoints = (
  transactions: readonly PointTransactionDTO[],
  now: Date,
) => {
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() + 1);

  return transactions
    .filter(
      transaction =>
        transaction.amount > 0 &&
        transaction.expires_at !== null &&
        new Date(transaction.expires_at) >= now &&
        new Date(transaction.expires_at) <= limit,
    )
    .reduce((sum, transaction) => sum + transaction.amount, 0);
};

export function calculateEarnedThisMonth(
  transactions: readonly PointTransactionDTO[],
  now: Date,
): number {
  return transactions
    .filter(transaction => transaction.transaction_type === 'earn')
    .filter(transaction => {
      const occurredAt = new Date(transaction.occurred_at);

      return (
        occurredAt.getFullYear() === now.getFullYear() &&
        occurredAt.getMonth() === now.getMonth()
      );
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

export const resolveUserCouponStatus = (
  userCoupon: UserCouponDTO,
  coupon: CouponDTO,
  now: Date,
): UserCouponStatus => {
  if (userCoupon.status === 'used') return 'used';

  if (
    userCoupon.status === 'expired' ||
    !coupon.is_active ||
    new Date(userCoupon.expires_at) < now ||
    new Date(coupon.ends_at) < now
  ) {
    return 'expired';
  }

  return 'available';
};
