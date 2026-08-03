import type { CouponDTO } from '@/domains/coupon';
import type {
  PointTransactionDTO,
  UserCouponDTO,
  UserCouponStatus,
} from './dto';

export type PointListFilter =
  | 'all'
  | 'purchase-earn'
  | 'review-earn'
  | 'other-earn'
  | 'use'
  | 'expire';

export interface PointListQuery {
  filter: PointListFilter;
  page: number;
}

export const USER_COUPON_TABS = [
  'all',
  'available',
  'used',
  'expired',
] as const;

export type UserCouponTab = (typeof USER_COUPON_TABS)[number];

export interface UserCouponListQuery {
  tab: UserCouponTab;
  page: number;
}

export const calculatePointBalance = (
  transactions: readonly PointTransactionDTO[],
) => transactions.reduce((sum, transaction) => sum + transaction.amount, 0);

export interface NextPointExpiration {
  expiresAt: string;
  amount: number;
}

export const getNextPointExpiration = (
  transactions: readonly PointTransactionDTO[],
  now: Date,
) : NextPointExpiration | null => {
  const expiringTransactions = transactions
    .filter(
      transaction =>
        transaction.amount > 0 &&
        transaction.expires_at !== null &&
        new Date(transaction.expires_at) >= now,
    )
    .sort((a, b) => a.expires_at!.localeCompare(b.expires_at!));
  const nextExpiration = expiringTransactions[0];

  if (!nextExpiration?.expires_at) return null;

  return {
    expiresAt: nextExpiration.expires_at,
    amount: expiringTransactions
      .filter(transaction => transaction.expires_at === nextExpiration.expires_at)
      .reduce((sum, transaction) => sum + transaction.amount, 0),
  };
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
