import { ChevronRight } from 'lucide-react';
import type { PointTransactionViewModel } from '@/domains/benefit';
import { MypageStatusBadge } from '../common/status-badge';

interface MypagePointTransactionCardProps {
  transaction: PointTransactionViewModel;
}

export function MypagePointTransactionCard({
  transaction,
}: MypagePointTransactionCardProps) {
  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 p-4 md:p-5">
      <div className="col-start-1 row-start-1 flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold tabular-nums text-zinc-500">
          {transaction.occurredTime}
        </p>
        <MypageStatusBadge {...transaction.type} />
      </div>
      <p className="col-start-2 row-span-2 row-start-1 self-center text-right text-lg font-black text-black tabular-nums">
        {transaction.amountText}
      </p>
      <h3 className="col-start-1 row-start-2 flex min-w-0 items-center gap-0.5 font-black text-black">
        <span className="min-w-0 truncate" title={transaction.description}>
          {transaction.description}
        </span>
        {transaction.showProductDetailIndicator ? (
          <ChevronRight
            aria-hidden="true"
            className="size-4 shrink-0 text-black"
          />
        ) : null}
      </h3>
    </article>
  );
}
