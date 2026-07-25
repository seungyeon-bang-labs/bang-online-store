import type { CouponRepository } from '@/domains/coupon';
import { requireRelation } from '@/shared/lib/data-integrity';
import { paginate } from '@/shared/lib/pagination';
import type { UserCouponListQuery } from './domain';
import { resolveUserCouponStatus } from './domain';
import { toUserCouponViewModel } from './mapper';
import type { UserCouponRepository } from './repository';
import type {
  UserCouponPageViewModel,
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
  getUserCouponPageViewModel(
    userId: string,
    query: UserCouponListQuery,
    now?: Date,
  ): Promise<UserCouponPageViewModel>;
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

  const getUserCouponPageViewModel = async (
    userId: string,
    query: UserCouponListQuery,
    now = new Date(),
  ): Promise<UserCouponPageViewModel> => {
    const items = (await getUserCouponItems(userId, now)).filter(
      item => item.statusCode === query.tab,
    );

    return paginate(items, query.page, 3);
  };

  return {
    getUserCouponItems,
    getUserCouponPageViewModel,
  };
}
