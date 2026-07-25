import { ButtonLink } from '@/components/ui/button';
import type { MypageHomeSummaryViewModel } from '@/domains/mypage';
import {
  MYPAGE_HOME_SUMMARY_ROWS,
  type MypageHomeSummaryItemId,
  type MypageHomeSummaryMenuItem,
} from './summary-menu';

interface MypageHomeSummaryProps {
  summary: MypageHomeSummaryViewModel;
}

export function MypageHomeSummary({ summary }: MypageHomeSummaryProps) {
  const valueByItemId: Record<MypageHomeSummaryItemId, string> = {
    member: summary.memberName + '님',
    address: summary.defaultAddressText,
    membership: summary.membershipTierName,
    points: summary.pointBalanceText,
    coupons: summary.availableCouponCount + '장',
  };

  return (
    <section>
      <div className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-200">
        <div className="grid grid-cols-1 gap-px lg:grid-cols-[3fr_5fr]">
          {MYPAGE_HOME_SUMMARY_ROWS[0].map(item => (
            <MypageHomeSummaryCard
              key={item.id}
              item={item}
              value={valueByItemId[item.id]}
            />
          ))}
        </div>

        <div className="mt-px grid grid-cols-1 gap-px lg:grid-cols-[3fr_3fr_2fr]">
          {MYPAGE_HOME_SUMMARY_ROWS[1].map(item => (
            <MypageHomeSummaryCard
              key={item.id}
              item={item}
              value={valueByItemId[item.id]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface MypageHomeSummaryCardProps {
  item: MypageHomeSummaryMenuItem;
  value: string;
}

function MypageHomeSummaryCard({
  item,
  value,
}: MypageHomeSummaryCardProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 bg-white px-5 py-4">
      <p className="col-start-1 row-start-1 text-left text-xs font-bold text-zinc-500">
        {item.label}
      </p>
      <p className="col-span-2 col-start-1 row-start-2 min-w-0 text-left text-base font-black tracking-tight text-black">
        {value}
      </p>
      <ButtonLink
        href={item.href}
        variant="outline"
        size="xs"
        className="col-start-2 row-start-1 self-center justify-self-end rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
      >
        {item.actionLabel}
      </ButtonLink>
    </div>
  );
}
