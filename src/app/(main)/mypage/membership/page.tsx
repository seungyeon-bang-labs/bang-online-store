import { Crown, TrendingUp } from 'lucide-react';
import { getMembershipViewModel } from '@/domains/benefit';
import { currentUserRepository } from '@/domains/member';
import {
  MypageEmptyState,
  MypageSectionHeader,
} from '@/features/mypage/common';
import { MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES } from '@/shared/lib/membership-tier-style';
import { cn } from '@/shared/lib/utils';

const MEMBERSHIP_EVALUATION_GUIDE_ITEMS = [
  '최근 12개월 동안 구매가 완료된 주문을 기준으로 산정합니다.',
  '매월 1일 구매 실적을 기준으로 멤버십 등급이 자동 갱신됩니다.',
  '쿠폰·적립금·할인 금액을 제외한 실제 결제 금액만 반영됩니다.',
  '취소하거나 반품한 상품의 결제 금액은 구매 실적에서 제외됩니다.',
] as const;

async function MembershipPage() {
  const user = await currentUserRepository.findCurrent();
  const membership = user ? await getMembershipViewModel(user.id) : null;

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="멤버십 혜택" />

      {membership ? (
        <div className="space-y-12 md:space-y-14">
          <div className="grid gap-6 lg:grid-cols-2">
            <section
              className={cn(
                'relative overflow-hidden rounded-md border border-white/10 bg-linear-to-br p-6 text-white',
                MEMBERSHIP_TIER_GRADIENT_CLASS_NAMES[
                  membership.currentTierCode
                ],
              )}
            >
              <div className="absolute inset-0 bg-linear-to-tr from-black/20 via-transparent to-white/10" />

              <div className="relative z-10 flex h-full min-h-52 flex-col">
                <div className="flex items-center gap-2">
                  <Crown className="size-5 text-white/70" />
                  <p className="text-xl font-black tracking-tight">
                    현재 멤버십 등급
                  </p>
                </div>

                <div className="flex flex-1 items-center justify-center py-5">
                  <h3 className="text-5xl font-black tracking-tight xl:text-6xl">
                    {membership.currentTierName}
                  </h3>
                </div>

                <div className="mt-auto rounded-md bg-black/15 px-4 py-3 text-center ring-1 ring-white/10">
                  <p className="text-sm font-semibold leading-relaxed text-white/90">
                    {membership.benefitSummary}
                  </p>
                </div>
              </div>
            </section>

            <section className="flex h-full flex-col rounded-md border border-zinc-300 bg-white p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-zinc-500" />
                <h3 className="text-xl font-black tracking-tight text-black">
                  등급 실적
                </h3>
              </div>
              <dl className="mt-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="shrink-0 text-sm font-bold text-zinc-500">
                    평가 구매 금액
                  </dt>
                  <dd className="text-right text-xl font-black tracking-tight text-black tabular-nums">
                    {membership.evaluationPurchaseText}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="shrink-0 text-sm font-bold text-zinc-500">
                    등급 적용 기간
                  </dt>
                  <dd className="whitespace-nowrap text-right text-sm font-bold text-zinc-700 tabular-nums">
                    {membership.periodText}
                  </dd>
                </div>
              </dl>
              <div className="mt-auto pt-6">
                <div className="border-t border-zinc-300 pt-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <p className="text-sm font-semibold leading-relaxed text-zinc-600">
                      {membership.nextTierName &&
                      membership.remainingAmountText
                        ? membership.nextTierName +
                          ' 등급까지 ' +
                          membership.remainingAmountText
                        : '최고 등급을 달성했습니다.'}
                    </p>
                    <p className="text-lg font-black tracking-tight text-black tabular-nums">
                      {Math.round(membership.progressPercent)}%
                    </p>
                  </div>
                  <div
                    role="progressbar"
                    aria-label="다음 등급 진행률"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(membership.progressPercent)}
                    className="mt-3 h-3 w-full overflow-hidden rounded-sm border-2 border-black bg-white"
                  >
                    <div
                      className="h-full bg-black"
                      style={{ width: `${membership.progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section>
            <h3 className="text-xl font-black tracking-tight text-black">
              전체 등급 안내
            </h3>
            <div className="mt-4 overflow-x-auto rounded-md border border-zinc-300 bg-white">
              <table className="w-full min-w-2xl table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[20%]" />
                  <col className="w-[25%]" />
                  <col className="w-[15%]" />
                  <col className="w-[40%]" />
                </colgroup>
                <thead className="bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="px-5 py-4 text-left font-bold">등급</th>
                    <th className="px-5 py-4 text-left font-bold">
                      평가 기준
                    </th>
                    <th className="px-5 py-4 text-center font-bold">
                      적립률
                    </th>
                    <th className="px-5 py-4 text-left font-bold">
                      주요 혜택
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {membership.tiers.map(tier => (
                    <tr
                      key={tier.id}
                      aria-current={tier.isCurrent ? 'true' : undefined}
                      className={tier.isCurrent ? 'bg-black' : 'bg-white'}
                    >
                      <td
                        className={cn(
                          'px-5 py-4 text-left text-base font-black tracking-tight',
                          tier.isCurrent ? 'text-white' : 'text-black',
                        )}
                      >
                        {tier.name}
                        {tier.isCurrent ? (
                          <span className="sr-only">현재 등급</span>
                        ) : null}
                      </td>
                      <td
                        className={cn(
                          'whitespace-nowrap px-5 py-4 text-left font-semibold tabular-nums',
                          tier.isCurrent
                            ? 'text-white/80'
                            : 'text-zinc-600',
                        )}
                      >
                        {tier.minPurchaseText} 이상
                      </td>
                      <td
                        className={cn(
                          'whitespace-nowrap px-5 py-4 text-center font-black tabular-nums',
                          tier.isCurrent ? 'text-white' : 'text-zinc-600',
                        )}
                      >
                        {tier.pointRateText}
                      </td>
                      <td
                        className={cn(
                          'px-5 py-4 text-left font-medium leading-relaxed',
                          tier.isCurrent
                            ? 'text-white/80'
                            : 'text-zinc-600',
                        )}
                      >
                        {tier.benefitSummary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="text-xl font-black tracking-tight text-black">
              등급 산정 안내
            </h3>

            <div className="mt-4 rounded-md bg-zinc-100 p-5 md:p-6">
              <ul className="list-disc space-y-2.5 pl-5 text-sm font-medium leading-relaxed text-zinc-700 marker:text-black">
                {MEMBERSHIP_EVALUATION_GUIDE_ITEMS.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      ) : (
        <MypageEmptyState
          icon={Crown}
          title="멤버십 정보가 없습니다."
          description="멤버십 가입 후 현재 등급과 받을 수 있는 혜택을 확인할 수 있습니다."
        />
      )}
    </div>
  );
}

export default MembershipPage;
