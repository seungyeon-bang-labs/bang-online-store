import type { MembershipProgressViewModel } from '@/domains/benefit';

interface MypageMembershipProgressCardProps {
  progress: MembershipProgressViewModel;
}

export function MypageMembershipProgressCard({
  progress,
}: MypageMembershipProgressCardProps) {
  const progressPercent = Math.round(progress.progressPercent);

  return (
    <section
      aria-label="다음 등급 진행 현황"
      className="min-h-60 rounded-md border border-zinc-300 bg-white p-6"
    >
      <dl className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm font-bold text-zinc-500">
            {progress.nextTierName
              ? `${progress.nextTierName} 등급까지`
              : '멤버십 등급'}
          </dt>
          <dd className="text-right text-xl font-black tracking-tight text-black tabular-nums">
            {progress.remainingAmountText
              ? `${progress.remainingAmountText} 남음`
              : '최고 등급'}
          </dd>
        </div>
        <div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm font-bold text-zinc-500">현재 진행률</dt>
            <dd className="text-lg font-black tracking-tight text-black tabular-nums">
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
        <div className="space-y-4 pt-1">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm font-bold text-zinc-500">평가 구매 금액</dt>
            <dd className="text-right text-base font-bold text-black tabular-nums">
              {progress.evaluationPurchaseText}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm font-bold text-zinc-500">등급 적용 기간</dt>
            <dd className="whitespace-nowrap text-right text-sm font-bold text-black tabular-nums">
              {progress.periodText}
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}
