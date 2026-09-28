import type { MembershipProgressViewModel } from '@/domains/benefit';
import { MypageCard } from '@/features/mypage/common';

interface MypageMembershipProgressCardProps {
  progress: MembershipProgressViewModel;
}

export function MypageMembershipProgressCard({
  progress,
}: MypageMembershipProgressCardProps) {
  const progressPercent = Math.round(progress.progressPercent);

  return (
    <MypageCard
      aria-label="다음 등급 진행 현황"
      mobileLayout="full-bleed"
      className="md:min-h-60"
    >
      <MypageCard.Header className="md:hidden">
        <MypageCard.Title>다음 등급 진행 현황</MypageCard.Title>
      </MypageCard.Header>
      <MypageCard.Body padding="roomy" className="md:flex md:min-h-60 md:items-center">
        <dl className="w-full space-y-3 md:space-y-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs font-bold text-zinc-500 md:text-base">
              {progress.nextTierName
                ? `${progress.nextTierName} 등급까지`
                : '멤버십 등급'}
            </dt>
            <dd className="text-right text-base font-black tracking-tight text-black tabular-nums md:text-lg">
              {progress.remainingAmountText
                ? `${progress.remainingAmountText} 남음`
                : '최고 등급'}
            </dd>
          </div>
          <div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs font-bold text-zinc-500 md:text-base">현재 진행률</dt>
              <dd className="text-base font-black tracking-tight text-black tabular-nums md:text-lg">
                {progressPercent}%
              </dd>
            </div>
            <div
              role="progressbar"
              aria-label="다음 등급 진행률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200"
            >
              <div
                className="h-full rounded-full bg-black"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
          <div className="space-y-3 pt-0.5 md:space-y-4 md:pt-1">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs font-bold text-zinc-500 md:text-base">평가 구매 금액</dt>
              <dd className="text-right text-xs font-bold text-black tabular-nums md:text-base">
                {progress.evaluationPurchaseText}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-xs font-bold text-zinc-500 md:text-base">등급 적용 기간</dt>
              <dd className="whitespace-nowrap text-right text-xs font-bold text-black tabular-nums md:text-base">
                {progress.periodText}
              </dd>
            </div>
          </div>
        </dl>
      </MypageCard.Body>
    </MypageCard>
  );
}
