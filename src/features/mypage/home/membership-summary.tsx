import Link from 'next/link';
import { ChevronRight, Crown } from 'lucide-react';
import type { MembershipTierCode } from '@/domains/benefit/dto';
import type { MembershipProgressViewModel } from '@/domains/benefit/view-model';
import { MEMBERSHIP_TIER_BADGE_CLASS_NAMES } from '@/shared/lib/membership-tier-style';
import { cn } from '@/shared/lib/utils';

interface MypageHomeMembershipSummaryProps {
  tierName: string;
  tierCode: MembershipTierCode;
  progress: MembershipProgressViewModel | null;
}

export function MypageHomeMembershipSummary({
  tierName,
  tierCode,
  progress,
}: MypageHomeMembershipSummaryProps) {
  const isHighestTier = progress !== null && progress.nextTierName === null;
  const percent = progress ? Math.round(progress.progressPercent) : 0;
  const description = !progress
    ? '멤버십 혜택과 등급 기준을 확인하세요'
    : isHighestTier
      ? '최고 등급 혜택을 누리고 있어요'
      : `${progress.nextTierName}까지 ${progress.remainingAmountText} 남았어요`;

  return (
    <Link
      href="/mypage/membership"
      aria-label={`${tierName}, ${description}, 멤버십 혜택 보기`}
      className={cn(
        'relative block w-full min-w-0 rounded-md border py-3 pl-3 pr-10 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black',
        MEMBERSHIP_TIER_BADGE_CLASS_NAMES[tierCode],
      )}
    >
      <span className="flex items-center gap-2">
        <Crown className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span className="min-w-0 flex-1 break-words text-sm font-bold md:text-base">{tierName}</span>
        {progress && (
          <span className="shrink-0 text-xs font-semibold tabular-nums md:text-sm">
            {isHighestTier ? '최고 등급' : `${percent}%`}
          </span>
        )}
      </span>
      {progress && (
        <span className="mt-2 block">
          <span
            role="progressbar"
            aria-label={isHighestTier ? '최고 등급 달성' : `다음 등급 ${progress.nextTierName} 진행률`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={isHighestTier ? 100 : percent}
            className="relative block h-1.5 w-full overflow-hidden rounded-full"
          >
            <span className="absolute inset-0 bg-current opacity-15" />
            <span className="relative block h-full rounded-full bg-current" style={{ width: `${isHighestTier ? 100 : progress.progressPercent}%` }} />
          </span>
        </span>
      )}
      <span className="mt-2 block break-words text-xs font-medium leading-4 md:text-sm md:leading-5">
        {progress &&
        !isHighestTier &&
        progress.nextTierName &&
        progress.remainingAmountText ? (
          <>
            {progress.nextTierName}까지{' '}
            <span className="font-bold tabular-nums">
              {progress.remainingAmountText}
            </span>{' '}
            남았어요
          </>
        ) : (
          description
        )}
      </span>
      <ChevronRight className="absolute right-3 top-1/2 size-4 -translate-y-1/2 opacity-70" aria-hidden="true" />
    </Link>
  );
}
