import {
  MEMBERSHIP_TIERS,
  POINT_TRANSACTIONS,
  USER_COUPONS,
  USER_MEMBERSHIPS,
} from './fixture';
import type {
  MembershipTierRepository,
  PointTransactionRepository,
  UserCouponRepository,
  UserMembershipRepository,
} from './repository';

export const fixtureMembershipTierRepository: MembershipTierRepository = {
  async findMany() {
    return MEMBERSHIP_TIERS.map(tier => ({ ...tier })).sort(
      (a, b) => a.level - b.level,
    );
  },
};

export const fixtureUserMembershipRepository: UserMembershipRepository = {
  async findByUserId(userId) {
    const membership =
      USER_MEMBERSHIPS.find(row => row.user_id === userId) ?? null;

    return membership ? { ...membership } : null;
  },
};

export const fixturePointTransactionRepository: PointTransactionRepository = {
  async findByUserId(userId) {
    return POINT_TRANSACTIONS.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  },
  async findByOrderIds(orderIds) {
    const orderIdSet = new Set(orderIds);

    return POINT_TRANSACTIONS.filter(
      row => row.order_id !== null && orderIdSet.has(row.order_id),
    ).map(row => ({ ...row }));
  },
  async findByReviewIds(reviewIds) {
    const reviewIdSet = new Set(reviewIds);

    return POINT_TRANSACTIONS.filter(
      row => row.review_id !== null && reviewIdSet.has(row.review_id),
    ).map(row => ({ ...row }));
  },
};

export const fixtureUserCouponRepository: UserCouponRepository = {
  async findByUserId(userId) {
    return USER_COUPONS.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.issued_at.localeCompare(a.issued_at));
  },
};
