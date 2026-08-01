import type { UserCouponViewModel } from '@/domains/benefit';
import { MypageStatusBadge } from './common/status-badge';

export function MypageCouponList({
  coupons,
}: {
  coupons: UserCouponViewModel[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {coupons.map(coupon => (
        <article
          key={coupon.id}
          className="rounded-md border border-zinc-300 bg-white p-5 md:p-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-2xl font-black tracking-tight text-black">
                {coupon.discountText}
              </p>
              <h3 className="mt-2 font-black text-zinc-700">
                {coupon.name}
              </h3>
            </div>
            <MypageStatusBadge {...coupon.status} />
          </div>
          <dl className="mt-6 space-y-3 border-t border-zinc-100 pt-4 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="font-bold text-zinc-400">사용 조건</dt>
              <dd className="text-right font-bold text-zinc-700">
                {coupon.conditionText}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="font-bold text-zinc-400">유효 기간</dt>
              <dd className="text-right font-bold text-zinc-700">
                {coupon.expiresAt}까지
              </dd>
            </div>
            {coupon.usedAt ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="font-bold text-zinc-400">사용일</dt>
                <dd className="text-right font-bold text-zinc-700">
                  {coupon.usedAt}
                </dd>
              </div>
            ) : null}
          </dl>
        </article>
      ))}
    </div>
  );
}
