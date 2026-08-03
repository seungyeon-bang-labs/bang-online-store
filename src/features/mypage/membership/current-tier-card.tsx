import { Crown } from 'lucide-react';
import type { MembershipCurrentTierViewModel } from '@/domains/benefit';
import { MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES } from '@/shared/lib/membership-tier-style';
import { cn } from '@/shared/lib/utils';

interface MypageMembershipCurrentTierCardProps {
  currentTier: MembershipCurrentTierViewModel;
}

export function MypageMembershipCurrentTierCard({
  currentTier,
}: MypageMembershipCurrentTierCardProps) {
  return (
    <section
      className={cn(
        'relative min-h-60 overflow-hidden rounded-md border border-white/10 bg-linear-to-br p-6 text-white',
        MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES[currentTier.currentTierCode],
      )}
    >
      <div className="absolute inset-0 bg-linear-to-tr from-black/10 via-transparent to-white/10" />

      <div className="relative z-10 flex h-full min-h-44 flex-col">
        <div className="flex items-center gap-2">
          <Crown className="size-5 text-white/70" />
          <p className="text-sm font-black text-white/80">현재 멤버십 등급</p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center py-4">
          <h3 className="text-4xl font-black tracking-tight md:text-5xl">
            {currentTier.currentTierName}
          </h3>
        </div>

        <div className="mt-auto rounded-md bg-black/15 px-4 py-2 text-center backdrop-blur-sm">
          <p className="text-sm font-semibold leading-relaxed text-white/85">
            {currentTier.benefitSummary}
          </p>
        </div>
      </div>
    </section>
  );
}
