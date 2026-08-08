import type {
  StatusTone,
  StatusViewModel,
} from '@/shared/types/status';
import { cn } from '@/shared/lib/utils';

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
};

const SIZE_CLASS = {
  default: 'px-2 py-1 text-xs',
  large: 'px-2.5 py-1 text-sm',
  responsive: 'px-2 py-1 text-xs sm:px-2.5 sm:text-sm',
};

interface MypageStatusBadgeProps extends StatusViewModel {
  size?: keyof typeof SIZE_CLASS;
}

export function MypageStatusBadge({
  label,
  tone,
  size = 'default',
}: MypageStatusBadgeProps) {
  return (
    <span
      className={cn(
        'shrink-0 whitespace-nowrap rounded-sm font-black',
        SIZE_CLASS[size],
        TONE_CLASS[tone],
      )}
    >
      {label}
    </span>
  );
}
