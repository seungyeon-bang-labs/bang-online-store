import type {
  StatusTone,
  StatusViewModel,
} from '@/domains/mypage/mypage-status.view-model';
import { cn } from '@/shared/lib/utils';

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700',
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
};

export function MypageStatusBadge({ label, tone }: StatusViewModel) {
  return (
    <span
      className={cn(
        'shrink-0 whitespace-nowrap rounded-sm px-2 py-1 text-xs font-black',
        TONE_CLASS[tone],
      )}
    >
      {label}
    </span>
  );
}
