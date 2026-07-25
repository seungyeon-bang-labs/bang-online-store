import {
  recentProductViewRepository,
  reviewRepository,
  toActivityProductViewModel,
  wishlistItemRepository,
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
import type { UserDTO } from '@/domains/member';
import { userAddressRepository } from '@/domains/member';
import {
  filterOrders,
  orderItemRepository,
  orderRepository,
  toOrderListItemViewModel,
  toOrderStatusViewModel,
} from '@/domains/order';
import { productRepository } from '@/domains/product';
import { requireRelation } from '@/shared/lib/data-integrity';
import { MYPAGE_HOME_ORDER_STATUS_SUMMARY_STATUSES } from './home.domain';
import { toMypageHomeRecentOrderViewModel } from './home.mapper';
import type { MypageHomeViewModel } from './home.view-model';

export async function getMypageHomeViewModel(
  user: UserDTO,
): Promise<MypageHomeViewModel> {
  const [
    defaultAddress,
    membership,
    membershipTiers,
    pointTransactions,
    userCoupons,
    orderRows,
    reviews,
    recentProductViews,
    wishlistItems,
  ] = await Promise.all([
    userAddressRepository.findDefaultByUserId(user.id),
    userMembershipRepository.findByUserId(user.id),
    membershipTierRepository.findMany(),
    pointTransactionRepository.findByUserId(user.id),
    userCouponRepository.findByUserId(user.id),
    orderRepository.findByUserId(user.id),
    reviewRepository.findByUserId(user.id),
    recentProductViewRepository.findByUserId(user.id),
    wishlistItemRepository.findByUserId(user.id),
  ]);

  const [orderItems, coupons] = await Promise.all([
    orderItemRepository.findByOrderIds(orderRows.map(order => order.id)),
    couponRepository.findByIds(
      Array.from(new Set(userCoupons.map(coupon => coupon.coupon_id))),
    ),
  ]);
  const products = await productRepository.findByIds(
    Array.from(
      new Set([
        ...orderItems.map(item => item.product_id),
        ...recentProductViews.map(item => item.product_id),
        ...wishlistItems.map(item => item.product_id),
      ]),
    ),
  );
  const productById = new Map(products.map(product => [product.id, product]));
  const couponById = new Map(coupons.map(coupon => [coupon.id, coupon]));
  const reviewedItemIds = new Set(
    reviews.map(review => review.order_item_id),
  );
  const orderItemsByOrderId = new Map<string, typeof orderItems>();
  const now = new Date();

  orderItems.forEach(item => {
    const items = orderItemsByOrderId.get(item.order_id) ?? [];
    items.push(item);
    orderItemsByOrderId.set(item.order_id, items);
  });

  const recentOrderIds = new Set(
    filterOrders(
      orderRows,
      { period: '3-months', status: 'all' },
      now,
    ).map(order => order.id),
  );
  const recentOrders = orderRows
    .filter(order => recentOrderIds.has(order.id))
    .sort((a, b) => b.ordered_at.localeCompare(a.ordered_at))
    .map(order => {
      const orderViewModel = toOrderListItemViewModel(
        order,
        (orderItemsByOrderId.get(order.id) ?? []).map(item => ({
          item,
          product: requireRelation(
            productById.get(item.product_id),
            'order_items.product_id -> products.id',
            item.id,
          ),
        })),
      );
      return toMypageHomeRecentOrderViewModel({
        order,
        orderViewModel,
        reviewedItemIds,
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

  return {
    summary: {
      memberName: user.name,
      defaultAddressText: defaultAddress
        ? [defaultAddress.address_line_1, defaultAddress.address_line_2]
            .filter(Boolean)
            .join(' ')
        : '등록된 배송지 없음',
      membershipTierName:
        membership && currentMembership
          ? toMembershipViewModel(
              membership,
              currentMembership,
              nextMembership,
              membershipTiers,
            ).currentTierName
          : '브론즈',
      pointBalanceText: toPointPageViewModel(pointTransactions, {
        type: 'all',
        page: 1,
      }).balanceText,
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
      count: recentOrders.filter(order => order.statusCode === status).length,
    })),
    recentOrders,
    recentProducts: recentProductViews
      .map(item =>
        toActivityProductViewModel(
          { id: item.id, recordedAt: item.viewed_at },
          requireRelation(
            productById.get(item.product_id),
            'recent_product_views.product_id -> products.id',
            item.id,
          ),
        ),
      )
      .slice(0, 7),
    wishlistProducts: wishlistItems
      .map(item =>
        toActivityProductViewModel(
          { id: item.id, recordedAt: item.created_at },
          requireRelation(
            productById.get(item.product_id),
            'wishlist_items.product_id -> products.id',
            item.id,
          ),
        ),
      )
      .slice(0, 5),
  };
}
