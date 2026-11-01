import type { PointTransactionViewModel } from '@/domains/benefit';
import { MypageBadge } from '../common/badge';

interface MypagePointTransactionCardProps {
  transaction: PointTransactionViewModel;
}

export function MypagePointTransactionCard({
  transaction,
}: MypagePointTransactionCardProps) {
  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 p-4 md:p-5">
      <div className="col-start-1 row-start-1 flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium tabular-nums text-zinc-500">
          {transaction.occurredTime}
        </p>
        <MypageBadge {...transaction.type} />
      </div>
      <p
        className={`col-start-2 row-span-2 row-start-1 self-center text-right text-base font-bold tabular-nums ${transaction.isDeduction ? 'text-red-600' : 'text-black'}`}
      >
        {transaction.amountText}
      </p>
      <h3 className="col-start-1 row-start-2 min-w-0 text-sm leading-5 font-bold text-black">
        <span className="block min-w-0 truncate" title={transaction.description}>
          {transaction.description}
        </span>
      </h3>
    </article>
  );
}
