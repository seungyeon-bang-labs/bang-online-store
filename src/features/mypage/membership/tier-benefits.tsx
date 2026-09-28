import type { MembershipTierViewModel } from '@/domains/benefit';
import { MypageCard } from '@/features/mypage/common';
import { cn } from '@/shared/lib/utils';

interface MypageMembershipTierBenefitsProps {
  membershipTiers: MembershipTierViewModel[];
}

export function MypageMembershipTierBenefits({
  membershipTiers,
}: MypageMembershipTierBenefitsProps) {
  return (
    <MypageCard mobileLayout="full-bleed">
      <MypageCard.Header className="md:hidden">
        <MypageCard.Title>등급별 혜택</MypageCard.Title>
      </MypageCard.Header>
      <div className="divide-y divide-zinc-200 md:hidden">
        {membershipTiers.map(tier => (
          <article
            key={tier.id}
            aria-current={tier.isCurrent ? 'true' : undefined}
            className={cn(
              'space-y-3 px-4 py-4',
              tier.isCurrent ? 'bg-black' : 'bg-white',
            )}
          >
            <div className="flex items-baseline justify-between gap-4">
              <h3
                className={cn(
                  'text-lg font-black tracking-tight text-black',
                  tier.isCurrent && 'text-white',
                )}
              >
                {tier.name}
              </h3>
              <p
                className={cn(
                  'flex items-baseline gap-1 tabular-nums',
                )}
              >
                <span
                  className={cn(
                    'text-xs font-bold text-zinc-500',
                    tier.isCurrent && 'text-white/65',
                  )}
                >
                  적립률
                </span>
                <span
                  className={cn(
                    'text-base font-black text-black',
                    tier.isCurrent && 'text-white',
                  )}
                >
                  {tier.pointRateText}
                </span>
              </p>
            </div>
            <dl className="space-y-1.5 text-sm leading-5">
              <div className="flex items-baseline justify-between gap-4">
                <dt
                  className={cn(
                    'text-xs font-bold text-zinc-500',
                    tier.isCurrent && 'text-white/65',
                  )}
                >
                  평가 기준
                </dt>
                <dd
                  className={cn(
                    'text-right font-semibold text-zinc-700 tabular-nums',
                    tier.isCurrent && 'text-white/85',
                  )}
                >
                  {tier.minPurchaseText} 이상
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt
                  className={cn(
                    'shrink-0 text-xs font-bold text-zinc-500',
                    tier.isCurrent && 'text-white/65',
                  )}
                >
                  주요 혜택
                </dt>
                <dd
                  className={cn(
                    'text-right font-semibold text-black',
                    tier.isCurrent && 'text-white/85',
                  )}
                >
                  {tier.benefitSummary}
                </dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <table className="hidden w-full min-w-2xl table-fixed border-collapse text-sm md:table">
        <caption className="sr-only">등급별 혜택</caption>
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[25%]" />
          <col className="w-[15%]" />
          <col className="w-[40%]" />
        </colgroup>
        <thead className="bg-zinc-100 text-zinc-700">
          <tr>
            <th className="px-5 py-3 text-left font-bold">등급</th>
            <th className="px-5 py-3 text-left font-bold">평가 기준</th>
            <th className="px-5 py-3 text-center font-bold">적립률</th>
            <th className="px-5 py-3 text-left font-bold">주요 혜택</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {membershipTiers.map(tier => (
            <tr
              key={tier.id}
              aria-current={tier.isCurrent ? 'true' : undefined}
              className={tier.isCurrent ? 'bg-black' : 'bg-white'}
            >
              <td
                className={cn(
                  'px-5 py-3 text-left text-base font-black tracking-tight text-black',
                  tier.isCurrent && 'text-white',
                )}
              >
                {tier.name}
              </td>
              <td
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-left font-medium text-zinc-500 tabular-nums',
                  tier.isCurrent && 'text-white/80',
                )}
              >
                {tier.minPurchaseText} 이상
              </td>
              <td
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-center text-base font-black text-black tabular-nums',
                  tier.isCurrent && 'text-white',
                )}
              >
                {tier.pointRateText}
              </td>
              <td
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-left font-bold text-black',
                  tier.isCurrent && 'text-white/80',
                )}
              >
                {tier.benefitSummary}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </MypageCard>
  );
}
