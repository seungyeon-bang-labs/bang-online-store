import type { CouponDTO } from './coupon.dto';

export interface CouponRepository {
  findMany(): Promise<CouponDTO[]>;
  findByIds(ids: number[]): Promise<CouponDTO[]>;
}
