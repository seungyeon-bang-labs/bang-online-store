import type { PointTransactionDTO } from '@/domains/benefit';

export function calculateUsedPointAmount(
  transactions: readonly PointTransactionDTO[],
): number {
  return transactions
    .filter(transaction => transaction.transaction_type === 'use')
    .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
}

export function calculateEarnedPointAmount(
  transactions: readonly PointTransactionDTO[],
): number {
  return transactions
    .filter(
      transaction =>
        transaction.transaction_type === 'earn' && transaction.amount > 0,
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
}
