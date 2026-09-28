import { MypageListStack } from '@/features/mypage/common/list-stack';
import type { UserCouponViewModel } from '@/domains/benefit';
import { MypageCouponCard } from './coupon-card';

interface MypageCouponListProps {
  coupons: UserCouponViewModel[];
}

export function MypageCouponList({ coupons }: MypageCouponListProps) {
  return (
    <MypageListStack layout="grid" density="default" className="grid-cols-1 justify-items-center lg:grid-cols-2 lg:justify-items-stretch">
      {coupons.map(coupon => (
        <MypageCouponCard key={coupon.id} coupon={coupon} />
      ))}
    </MypageListStack>
  );
}
