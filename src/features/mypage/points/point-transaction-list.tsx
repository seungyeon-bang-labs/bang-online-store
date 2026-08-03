import type { PointDateGroupViewModel } from '@/domains/benefit';
import { MypagePointTransactionCard } from './point-transaction-card';

interface MypagePointTransactionListProps {
  dateGroups: PointDateGroupViewModel[];
}

export function MypagePointTransactionList({
  dateGroups,
}: MypagePointTransactionListProps) {
  return (
    <div className="space-y-6">
      {dateGroups.map(({ date, transactions }) => (
        <section key={date} aria-labelledby={`point-date-${date}`}>
          <div className="overflow-hidden rounded-md border border-zinc-300 bg-white">
            <h2
              id={`point-date-${date}`}
              className="border-b border-zinc-200 px-4 py-3 text-sm font-black text-black md:px-5"
            >
              {date}
            </h2>
            <div className="divide-y divide-zinc-100">
              {transactions.map(transaction => (
                <MypagePointTransactionCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
