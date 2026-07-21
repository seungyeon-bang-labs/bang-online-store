import { Download } from 'lucide-react';
import type { CouponCardViewModel } from '@/domains/coupon';
import { cn } from '@/shared/lib/utils';

interface EventCouponItemProps {
  couponCardViewModel: CouponCardViewModel;
  disabled?: boolean;
}

export function EventCouponItem({
  couponCardViewModel,
  disabled = false,
}: EventCouponItemProps) {
  return (
    <div
      className={cn(
        'group relative flex h-48 w-full max-w-md overflow-hidden rounded-xl bg-white transition-all sm:h-52 md:h-56',
      )}
    >
      <div
        className={cn(
          'relative flex grow flex-col justify-between overflow-hidden bg-linear-to-br p-4 text-white sm:p-5 md:p-6',
          disabled ? 'bg-neutral-400' :
          'from-black via-gray-700 to-black',
        )}
      >
        <div className="relative z-10 flex items-center gap-3">
          <div className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest sm:text-xs">
            {couponCardViewModel.categoryText}
          </div>
          <h3 className="line-clamp-1 text-xs font-medium opacity-90 sm:text-sm">
            {couponCardViewModel.title}
          </h3>
        </div>

        <div className="relative z-10 grow flex items-center justify-center font-extrabold tracking-tighter text-white">
          <span className="text-4xl sm:text-5xl">
            {couponCardViewModel.discountValueText}
          </span>
          {couponCardViewModel.discountUnitText && (
            <span
              className={cn(
                'ml-1 text-2xl sm:text-3xl',
                couponCardViewModel.isDiscountUnitSubtle &&
                  'font-medium opacity-80',
              )}
            >
              {couponCardViewModel.discountUnitText}
            </span>
          )}
        </div>

        <div className="relative z-10 flex flex-col gap-1 text-[11px] tracking-tight opacity-70 sm:flex-row sm:items-end sm:justify-between sm:text-xs">
          <p className="line-clamp-1">
            {couponCardViewModel.minOrderAmountText}
            {couponCardViewModel.isStackable && (
              <span className="ml-1.5">| 중복가능</span>
            )}
          </p>
          <p className="shrink-0">{couponCardViewModel.expiryText}</p>
        </div>
      </div>

      <div className="relative w-0 flex justify-center shrink-0">
        <div className="h-full border-l border-dashed border-white" />

        <div className="absolute -top-3 w-6 h-6 bg-white rounded-full left-1/2 -translate-x-1/2" />

        <div className="absolute -bottom-3 w-6 h-6 bg-white rounded-full left-1/2 -translate-x-1/2" />
      </div>

      <button
        type="button"
        disabled={disabled}
        className={cn(
          'flex h-full w-24 shrink-0 flex-col items-center justify-center text-white sm:w-28 md:w-32',
          disabled
            ? 'cursor-not-allowed bg-neutral-400'
            : 'cursor-pointer bg-linear-to-br from-gray-700 to-black from-10% to-40% hover:bg-none hover:bg-gray-200 hover:text-black',
        )}
      >
        <Download className="mb-2 size-8 stroke-[1.5] md:size-10" />
        <span className="text-[11px] font-semibold tracking-wide sm:text-xs">
          {disabled ? '종료됨' : '다운로드'}
        </span>
      </button>
    </div>
  );
}
