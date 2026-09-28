import type { PointDateGroupViewModel } from '@/domains/benefit';
import { MypageCard } from '@/features/mypage/common';
import {
  MYPAGE_DATE_GROUP_HEADER_CLASS_NAME,
  MYPAGE_DATE_GROUP_TITLE_CLASS_NAME,
} from '@/features/mypage/common/styles';
import { MypagePointTransactionCard } from './point-transaction-card';
import { MypagePointTransactionTable } from './point-transaction-table';

interface MypagePointTransactionListProps {
  dateGroups: PointDateGroupViewModel[];
}

export function MypagePointTransactionList({
  dateGroups,
}: MypagePointTransactionListProps) {
  const transactions = dateGroups.flatMap(dateGroup => dateGroup.transactions);

  return (
    <>
      <MypageCard mobileLayout="full-bleed" className="lg:hidden">
        {dateGroups.map(({ date, transactions }, index) => (
          <section
            key={date}
            aria-labelledby={`point-date-${date}`}
            className={index > 0 ? 'border-t border-zinc-200' : undefined}
          >
            <header className={`border-b border-zinc-200 ${MYPAGE_DATE_GROUP_HEADER_CLASS_NAME}`}>
              <MypageCard.Title
                id={`point-date-${date}`}
                className={MYPAGE_DATE_GROUP_TITLE_CLASS_NAME}
              >
                {date}
              </MypageCard.Title>
            </header>
            <div className="divide-y divide-zinc-300">
              {transactions.map(transaction => (
                <MypagePointTransactionCard
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>
          </section>
        ))}
      </MypageCard>
      <MypagePointTransactionTable transactions={transactions} />
    </>
  );
}
