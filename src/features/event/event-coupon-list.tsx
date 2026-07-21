import { EventCouponItem } from '@/features/event/event-coupon-item';
import type { CouponSectionViewModel } from '@/domains/coupon';

const COUPON_NOTICE_ITEMS = [
  '쿠폰은 중복 사용이 불가할 수 있으며, 일부 품목은 제외될 수 있습니다.',
  '발급된 쿠폰은 마이페이지에서 확인 가능합니다.',
  '유효기간이 지난 쿠폰은 자동 소멸되오니 기간 내 사용 바랍니다.',
];

type EventCouponListProps = {
  couponSection: CouponSectionViewModel;
  disabled?: boolean;
};

function EventCouponSectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 pb-2 md:mb-12 md:pb-6">
      <h2 className="text-xl md:text-2xl font-black tracking-tight text-neutral-900">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500 md:text-base">
        {description}
      </p>
    </div>
  );
}

function EventCouponNotice() {
  return (
    <div className="mt-8 rounded-lg bg-neutral-100 p-4 md:mt-12 md:p-6">
      <ul className="text-sm text-neutral-700 space-y-1 list-disc list-inside">
        {COUPON_NOTICE_ITEMS.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function EventCouponList({
  couponSection,
  disabled = false,
}: EventCouponListProps) {
  if (!couponSection.coupons.length) return null;

  return (
    <div className="mx-auto max-w-6xl rounded-lg bg-white px-4 py-8 shadow-sm sm:px-6 md:px-8 md:py-12">
      <EventCouponSectionHeader
        title={couponSection.title}
        description={
          disabled
            ? '종료된 이벤트로 쿠폰을 다운로드할 수 없습니다.'
            : couponSection.description
        }
      />

      <div className="flex flex-col items-center gap-8 pb-4 md:gap-12 md:pb-6">
        {couponSection.coupons.map(couponCardViewModel => (
          <EventCouponItem
            key={couponCardViewModel.id}
            couponCardViewModel={couponCardViewModel}
            disabled={disabled}
          />
        ))}
      </div>

      <EventCouponNotice />
    </div>
  );
}
