import { couponRepository } from '@/domains/coupon';
import {
  fixtureMembershipTierRepository,
  fixturePointTransactionRepository,
  fixtureUserCouponRepository,
  fixtureUserMembershipRepository,
} from './fixture-repository';
import { createMembershipService } from './membership.service';
import { createUserCouponService } from './user-coupon.service';

export * from './domain';
export * from './dto';
export * from './mapper';
export * from './repository';
export * from './view-model';
export * from './membership.service';
export * from './user-coupon.service';

export const membershipTierRepository = fixtureMembershipTierRepository;
export const pointTransactionRepository = fixturePointTransactionRepository;
export const userCouponRepository = fixtureUserCouponRepository;
export const userMembershipRepository = fixtureUserMembershipRepository;

const membershipService = createMembershipService({
  membershipTierRepository,
  userMembershipRepository,
});
const userCouponService = createUserCouponService({
  couponRepository,
  userCouponRepository,
});

export const getMembershipViewModel =
  membershipService.getMembershipViewModel;
export const getUserCouponItems = userCouponService.getUserCouponItems;
export const getUserCouponPageViewModel =
  userCouponService.getUserCouponPageViewModel;
