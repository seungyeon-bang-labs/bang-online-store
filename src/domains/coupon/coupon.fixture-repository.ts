import { COUPONS } from './coupon.fixture';
import type { CouponRepository } from './coupon.repository';

export const fixtureCouponRepository: CouponRepository = {
  async findMany() {
    return COUPONS.map(coupon => ({ ...coupon }));
  },
  async findByIds(ids) {
    return COUPONS.filter(coupon => ids.includes(coupon.id)).map(coupon => ({
      ...coupon,
    }));
  },
};
