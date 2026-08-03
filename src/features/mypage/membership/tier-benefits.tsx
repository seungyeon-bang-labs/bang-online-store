import type { MembershipTierViewModel } from '@/domains/benefit';
import { cn } from '@/shared/lib/utils';

interface MypageMembershipTierBenefitsProps {
  membershipTiers: MembershipTierViewModel[];
}

export function MypageMembershipTierBenefits({
  membershipTiers,
}: MypageMembershipTierBenefitsProps) {
  return (
    <section className="overflow-x-auto rounded-md border border-zinc-300 bg-white">
      <table className="w-full min-w-2xl table-fixed border-collapse text-sm">
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
                  'whitespace-nowrap px-5 py-3 text-left font-semibold text-zinc-600 tabular-nums',
                  tier.isCurrent && 'text-white/80',
                )}
              >
                {tier.minPurchaseText} 이상
              </td>
              <td
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-center font-black text-zinc-600 tabular-nums',
                  tier.isCurrent && 'text-white',
                )}
              >
                {tier.pointRateText}
              </td>
              <td
                className={cn(
                  'whitespace-nowrap px-5 py-3 text-left font-medium text-zinc-600',
                  tier.isCurrent && 'text-white/80',
                )}
              >
                {tier.benefitSummary}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
