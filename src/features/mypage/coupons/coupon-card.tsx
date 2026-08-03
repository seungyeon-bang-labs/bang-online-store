import type { UserCouponViewModel } from '@/domains/benefit';
import { cn } from '@/shared/lib/utils';
import { MypageStatusBadge } from '../common/status-badge';

const STATUS_ACCENT_CLASS = {
  available: 'border-l-emerald-500',
  used: 'border-l-zinc-400',
  expired: 'border-l-red-400',
} as const;

interface MypageCouponCardProps {
  coupon: UserCouponViewModel;
}

export function MypageCouponCard({ coupon }: MypageCouponCardProps) {
  const isAvailable = coupon.statusCode === 'available';

  return (
    <article
      className={cn(
        'w-full max-w-104 rounded-md border border-zinc-300 border-l-4 bg-white p-5 md:p-6 lg:max-w-none',
        STATUS_ACCENT_CLASS[coupon.statusCode],
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2">
        <p
          className={cn(
            'min-w-0 text-xl font-black tracking-tight md:text-2xl',
            isAvailable ? 'text-black' : 'text-zinc-600',
          )}
        >
          {coupon.discountText}
        </p>
        <MypageStatusBadge {...coupon.status} size="large" />
        <h3
          className={cn(
            'col-span-2 truncate font-black',
            isAvailable ? 'text-black' : 'text-zinc-600',
          )}
        >
          {coupon.name}
        </h3>
      </div>
      <dl className="mt-6 space-y-3 border-t border-zinc-100 pt-4 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt
            className={cn(
              'font-bold',
              isAvailable ? 'text-zinc-500' : 'text-zinc-400',
            )}
          >
            사용 조건
          </dt>
          <dd
            className={cn(
              'text-right font-bold',
              isAvailable ? 'text-zinc-700' : 'text-zinc-500',
            )}
          >
            {coupon.conditionText}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt
            className={cn(
              'font-bold',
              isAvailable ? 'text-zinc-500' : 'text-zinc-400',
            )}
          >
            유효 기간
          </dt>
          <dd
            className={cn(
              'text-right font-black',
              isAvailable ? 'text-black' : 'text-zinc-500',
            )}
          >
            {coupon.expiresAt}까지
          </dd>
        </div>
      </dl>
    </article>
  );
}
