import type { PointSummaryViewModel } from '@/domains/benefit';

interface MypagePointSummaryProps {
  summary: PointSummaryViewModel;
}

export function MypagePointSummary({ summary }: MypagePointSummaryProps) {
  const summaryItems = [
    {
      label: '사용 가능 적립금',
      emphasizedLabel: null,
      value: summary.balanceText,
    },
    {
      label: '이번 달 적립',
      emphasizedLabel: null,
      value: summary.earnedThisMonthText,
    },
    {
      label: '소멸 예정',
      emphasizedLabel: summary.expiringDateText,
      value: summary.expiringText,
    },
  ] as const;

  return (
    <section className="-mx-4 overflow-hidden border-y border-zinc-200 bg-zinc-200 md:mx-0 md:rounded-md md:border">
      <div className="grid grid-cols-1 gap-px md:grid-cols-3">
        {summaryItems.map(item => (
          <div
            key={item.label}
            className="flex items-center justify-between bg-white px-4 py-3 md:block md:p-5"
          >
            <p className="text-sm font-semibold text-zinc-500">
              {item.emphasizedLabel ? (
                <>
                  <span className="font-semibold text-zinc-700">
                    {item.emphasizedLabel}
                  </span>{' '}
                  {item.label}
                </>
              ) : (
                item.label
              )}
            </p>
            <p className="text-base font-bold text-black tabular-nums md:mt-3 md:text-lg">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
