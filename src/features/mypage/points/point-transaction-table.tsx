import type { PointTransactionViewModel } from '@/domains/benefit';
import { MypageCard } from '@/features/mypage/common';
import { MypageBadge } from '../common/badge';

interface MypagePointTransactionTableProps {
  transactions: readonly PointTransactionViewModel[];
}

export function MypagePointTransactionTable({
  transactions,
}: MypagePointTransactionTableProps) {
  return (
    <MypageCard className="hidden overflow-hidden lg:block">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-44" />
            <col className="w-28" />
            <col />
            <col className="w-28" />
            <col className="w-32" />
          </colgroup>
          <thead className="bg-zinc-100 text-left text-sm font-bold text-zinc-700">
            <tr>
              <th scope="col" className="px-5 py-3.5">날짜</th>
              <th scope="col" className="px-5 py-3.5 text-center">구분</th>
              <th scope="col" className="px-5 py-3.5">내용</th>
              <th scope="col" className="px-5 py-3.5 text-center">적립금</th>
              <th scope="col" className="px-5 py-3.5 text-center">유효기간</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {transactions.map(transaction => (
              <tr key={transaction.id}>
                <td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-zinc-500">
                  {transaction.occurredDate} {transaction.occurredTime}
                </td>
                <td className="px-5 py-4 text-center">
                  <MypageBadge {...transaction.type} />
                </td>
                <td className="min-w-0 px-5 py-4 font-bold text-black">
                  <span className="block truncate" title={transaction.description}>
                    {transaction.description}
                  </span>
                </td>
                <td
                  className={`whitespace-nowrap px-5 py-4 text-right text-base font-black tabular-nums ${transaction.isDeduction ? 'text-red-600' : 'text-black'}`}
                >
                  {transaction.amountText}
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums text-zinc-500">
                  {transaction.expirationText}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MypageCard>
  );
}
