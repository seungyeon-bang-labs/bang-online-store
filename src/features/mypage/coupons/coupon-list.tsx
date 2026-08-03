import type { UserCouponViewModel } from '@/domains/benefit';
import { MypageCouponCard } from './coupon-card';

interface MypageCouponListProps {
  coupons: UserCouponViewModel[];
}

export function MypageCouponList({ coupons }: MypageCouponListProps) {
  return (
    <div className="grid grid-cols-1 justify-items-center gap-6 lg:grid-cols-2 lg:justify-items-stretch">
      {coupons.map(coupon => (
        <MypageCouponCard key={coupon.id} coupon={coupon} />
      ))}
    </div>
  );
}
