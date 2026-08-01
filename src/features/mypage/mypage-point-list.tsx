import type { PointTransactionViewModel } from '@/domains/benefit';
import { MypageStatusBadge } from './common/status-badge';

export function MypagePointList({
  transactions,
}: {
  transactions: PointTransactionViewModel[];
}) {
  return (
    <div className="divide-y divide-zinc-100 overflow-hidden rounded-md border border-zinc-300 bg-white">
      {transactions.map(transaction => (
        <article
          key={transaction.id}
          className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:p-6"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <MypageStatusBadge {...transaction.type} />
              <p className="text-xs font-medium text-zinc-400">
                {transaction.occurredAt}
              </p>
            </div>
            <h3 className="mt-3 font-black text-black">
              {transaction.description}
            </h3>
            {transaction.expiresAt ? (
              <p className="mt-2 text-xs font-medium text-zinc-500">
                소멸 예정일 {transaction.expiresAt}
              </p>
            ) : null}
          </div>
          <p className="shrink-0 text-lg font-black text-black">
            {transaction.amountText}
          </p>
        </article>
      ))}
    </div>
  );
}
