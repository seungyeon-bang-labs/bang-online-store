import type { CouponRepository } from '@/domains/coupon';
import { requireRelation } from '@/shared/lib/data-integrity';
import { paginate } from '@/shared/lib/pagination';
import type { UserCouponListQuery } from './domain';
import { resolveUserCouponStatus } from './domain';
import { toUserCouponViewModel } from './mapper';
import type { UserCouponRepository } from './repository';
import type {
  UserCouponListViewModel,
  UserCouponViewModel,
} from './view-model';

export interface UserCouponServiceDependencies {
  couponRepository: CouponRepository;
  userCouponRepository: UserCouponRepository;
}

export interface UserCouponService {
  getUserCouponItems(
    userId: string,
    now?: Date,
  ): Promise<UserCouponViewModel[]>;
  getUserCouponListViewModel(
    userId: string,
    query: UserCouponListQuery,
    now?: Date,
  ): Promise<UserCouponListViewModel>;
}

export function createUserCouponService({
  couponRepository,
  userCouponRepository,
}: UserCouponServiceDependencies): UserCouponService {
  const getUserCouponItems = async (
    userId: string,
    now = new Date(),
  ): Promise<UserCouponViewModel[]> => {
    const rows = await userCouponRepository.findByUserId(userId);
    const coupons = await couponRepository.findByIds(
      Array.from(new Set(rows.map(row => row.coupon_id))),
    );
    const couponById = new Map(coupons.map(coupon => [coupon.id, coupon]));

    return rows.map(row => {
      const coupon = requireRelation(
        couponById.get(row.coupon_id),
        'user_coupons.coupon_id -> coupons.id',
        row.id,
      );

      return toUserCouponViewModel(
        row,
        coupon,
        resolveUserCouponStatus(row, coupon, now),
      );
    });
  };

  const getUserCouponListViewModel = async (
    userId: string,
    query: UserCouponListQuery,
    now = new Date(),
  ): Promise<UserCouponListViewModel> => {
    const sourceItems = await getUserCouponItems(userId, now);
    const items = sourceItems.filter(
      item => query.tab === 'all' || item.statusCode === query.tab,
    );
    const page = paginate(items, query.page, 10);

    return {
      coupons: page.items,
      currentPage: page.currentPage,
      totalPages: page.totalPages,
      totalItems: page.totalItems,
      unfilteredItemCount: sourceItems.length,
    };
  };

  return {
    getUserCouponItems,
    getUserCouponListViewModel,
  };
}
