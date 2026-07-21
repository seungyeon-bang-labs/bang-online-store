import {
  MEMBERSHIP_TIERS,
  POINT_TRANSACTIONS,
  USER_COUPONS,
  USER_MEMBERSHIPS,
} from './benefit.fixture';
import type {
  MembershipTierRepository,
  PointTransactionRepository,
  UserCouponRepository,
  UserMembershipRepository,
} from './benefit.repository';

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
};

export const fixtureUserCouponRepository: UserCouponRepository = {
  async findByUserId(userId) {
    return USER_COUPONS.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.issued_at.localeCompare(a.issued_at));
  },
};
