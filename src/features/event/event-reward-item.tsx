import { CreditCard } from 'lucide-react';
import type {
  EventRewardCardViewModel,
  EventRewardColor,
} from '@/domains/event';
import { MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES } from '@/shared/lib/membership-tier-style';
import { cn } from '@/shared/lib/utils';

interface EventRewardItemProps {
  reward: EventRewardCardViewModel;
  disabled?: boolean;
}

const REWARD_CARD_COLOR_CLASS_NAMES: Record<EventRewardColor, string> = {
  black: 'from-black/95 via-zinc-600 to-black/95',
  bronze: MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES.BRONZE,
  silver: MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES.SILVER,
  gold: MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES.GOLD,
  platinum: MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES.PLATINUM,
};

export function EventRewardItem({
  reward,
  disabled = false,
}: EventRewardItemProps) {
  return (
    <div
      className={cn(
        'relative aspect-16/10 w-full max-w-md overflow-hidden rounded-xl bg-linear-to-br p-6 text-white shadow-xl shadow-black/20 ring-1 ring-white/10',
        disabled
          ? 'from-zinc-500 via-zinc-500 to-zinc-600'
          : REWARD_CARD_COLOR_CLASS_NAMES[reward.color],
      )}
    >
      <div className="absolute inset-0 bg-linear-to-tr from-black/10 via-transparent to-white/15" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/60">
            Reward Card
          </p>
          <h3 className="mt-2 text-sm font-semibold text-white/90">
            {reward.title}
          </h3>
        </div>

        <CreditCard className="size-7 text-white/70" strokeWidth={1.75} />
      </div>

      <p className="absolute inset-0 z-10 flex items-center justify-center px-6 text-center text-3xl font-black tracking-tight md:text-4xl">
        {reward.valueLabel}
      </p>

      <div className="absolute inset-x-6 bottom-6 z-10">
        <div className="flex items-end justify-between gap-4">
          <p className="line-clamp-2 text-xs font-medium leading-relaxed text-white/75">
            {reward.description}
          </p>
          <span className="shrink-0 rounded-sm bg-white/15 px-2 py-1 text-[10px] font-bold tracking-widest text-white/75">
            {disabled ? '마감' : '진행중'}
          </span>
        </div>
      </div>
    </div>
  );
}
