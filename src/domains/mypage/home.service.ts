import 'server-only';

import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';
import {
  createMemberProfileRepository,
  createUserAddressRepository,
} from '@/domains/member/supabase-repository.server';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import {
  getRecentProductItems,
  getWishlistProductItems,
  isReviewWritable,
  reviewRepository,
} from '@/domains/activity';
import {
  membershipTierRepository,
  pointTransactionRepository,
  resolveUserCouponStatus,
  toMembershipViewModel,
  toPointPageViewModel,
  userCouponRepository,
  userMembershipRepository,
} from '@/domains/benefit';
import { couponRepository } from '@/domains/coupon';
import { getUserAddressText, type UserDTO } from '@/domains/member';
import {
  filterOrders,
  joinOrderItems,
  toOrderListItemViewModel,
  toOrderStatusViewModel,
} from '@/domains/order';
import { createMemberOrderReadServices } from '@/domains/order/member-order-read.server';
import { requireRelation } from '@/shared/lib/data-integrity';
import {
  MYPAGE_HOME_ORDER_STATUS_SUMMARY_STATUSES,
} from './home.domain';
import { toMypageHomeRecentOrderViewModel } from './home.mapper';
import type { MypageHomeViewModel } from './home.view-model';

export async function getMypageHomeViewModel(
  demoUser: UserDTO,
): Promise<MypageHomeViewModel> {
  const access = await getCurrentMemberAccess();

  if (access.status !== 'active') {
    throw new Error('회원 정보를 확인하지 못했습니다.');
  }

  const client = await createAuthClient();
  const profile = await createMemberProfileRepository(client)
    .findById(access.member.id);

  if (!profile) {
    throw new Error('회원 정보를 확인하지 못했습니다.');
  }

  const orders = createMemberOrderReadServices(client);
  const [
    defaultAddress,
    membership,
    membershipTiers,
    pointTransactions,
    userCoupons,
    orderRows,
    reviews,
    recentProducts,
    wishlistProducts,
  ] = await Promise.all([
    createUserAddressRepository(client).findDefaultByUserId(access.member.id),
    userMembershipRepository.findByUserId(demoUser.id),
    membershipTierRepository.findMany(),
    pointTransactionRepository.findByUserId(demoUser.id),
    userCouponRepository.findByUserId(demoUser.id),
    orders.orderRepository.findByUserId(access.member.id),
    reviewRepository.findByUserId(demoUser.id),
    getRecentProductItems(demoUser.id),
    getWishlistProductItems(demoUser.id),
  ]);

  const now = new Date();
  const recentOrderRows = filterOrders(
    orderRows,
    { period: 'all', status: 'all' },
    now,
  ).slice(0, 3);
  // Only the three recent orders are shown, so only their items are read.
  const [relations, coupons] = await Promise.all([
    orders.orderItemRelationsService.getOrderItemRelations(
      recentOrderRows.map(order => order.id),
    ),
    couponRepository.findByIds(
      Array.from(new Set(userCoupons.map(coupon => coupon.coupon_id))),
    ),
  ]);
  const couponById = new Map(coupons.map(coupon => [coupon.id, coupon]));
  const reviewedItemIds = new Set(
    reviews.map(review => review.order_item_id),
  );
  const orderById = new Map(orderRows.map(order => [order.id, order]));

  // DB 주문에는 아직 취소·교환·반품 내역이 없다.
  const writableReviewOrderItemIds = new Set(
    Array.from(relations.itemById.values())
      .filter(item => {
        const order = orderById.get(item.order_id);

        return order
          ? isReviewWritable(
              {
                orderStatus: order.status,
                deliveredAt: order.delivered_at,
                hasReview: reviewedItemIds.has(item.id),
                isCancelled: false,
                hasCompletedClaim: false,
              },
              now,
            )
          : false;
      })
      .map(item => item.id),
  );
  const recentStatusOrders = filterOrders(
    orderRows,
    { period: '1-month', status: 'all' },
    now,
  );
  const recentOrders = recentOrderRows.map(order => {
    const orderViewModel = toOrderListItemViewModel(
      order,
      joinOrderItems(
        order.id,
        relations.itemsByOrderId,
        relations.productById,
        new Map(),
      ),
    );
    return toMypageHomeRecentOrderViewModel({
      order,
      orderViewModel,
      writableReviewOrderItemIds,
      reviewedOrderItemIds: reviewedItemIds,
    });
  });
  const currentMembership = membership
    ? requireRelation(
        membershipTiers.find(tier => tier.id === membership.tier_id),
        'user_memberships.tier_id -> membership_tiers.id',
        membership.id,
      )
    : null;
  const nextMembership = currentMembership
    ? membershipTiers
        .filter(tier => tier.level > currentMembership.level)
        .sort((a, b) => a.level - b.level)[0] ?? null
    : null;

  const membershipViewModel = membership && currentMembership
    ? toMembershipViewModel(membership, currentMembership, nextMembership, membershipTiers)
    : null;

  return {
    summary: {
      memberName: profile.name,
      defaultAddressText: defaultAddress
        ? getUserAddressText(defaultAddress)
        : '등록된 배송지 없음',
      membershipTierCode: currentMembership?.code ?? 'BRONZE',
      membershipTierName: membershipViewModel?.currentTier.currentTierName ?? '브론즈',
      membershipProgress: membershipViewModel?.progress ?? null,
      pointBalanceText: toPointPageViewModel(pointTransactions, {
        filter: 'all',
        page: 1,
      }).summary.balanceText,
      availableCouponCount: userCoupons.filter(userCoupon => {
        const coupon = requireRelation(
          couponById.get(userCoupon.coupon_id),
          'user_coupons.coupon_id -> coupons.id',
          userCoupon.id,
        );

        return resolveUserCouponStatus(userCoupon, coupon, now) === 'available';
      }).length,
    },
    orderStatuses: MYPAGE_HOME_ORDER_STATUS_SUMMARY_STATUSES.map(status => ({
      status,
      label: toOrderStatusViewModel(status).label,
      count: recentStatusOrders.filter(order => order.status === status).length,
    })),
    recentOrders,
    recentProducts,
    wishlistProducts: wishlistProducts.slice(0, 10),
  };
}
