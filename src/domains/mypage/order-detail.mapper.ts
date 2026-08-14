import {
  calculateEarnedPointAmount,
  calculateUsedPointAmount,
  type PointTransactionDTO,
} from '@/domains/benefit';
import type { OrderDetailViewModel } from '@/domains/order';
import { formatKoreanPoints } from '@/shared/lib/format';
import type {
  MypageOrderDetailViewModel,
  MypageOrderPointBenefitViewModel,
} from './order-detail.view-model';

const POINT_BENEFIT_LABELS: Record<
  MypageOrderPointBenefitViewModel['type'],
  string
> = {
  purchase: '구매 적립',
  review: '리뷰 작성 적립',
};

export function toMypageOrderDetailViewModel(
  order: OrderDetailViewModel,
  orderPointTransactions: readonly PointTransactionDTO[],
  reviewPointTransactions: readonly PointTransactionDTO[],
): MypageOrderDetailViewModel {
  const { payment, ...orderDetail } = order;
  const usedPointAmount = calculateUsedPointAmount(orderPointTransactions);

  return {
    order: orderDetail,
    payment: {
      ...payment,
      pointUsageAmountText:
        usedPointAmount > 0 ? formatKoreanPoints(usedPointAmount) : null,
    },
    pointBenefits: [
      toPointBenefitViewModel(orderPointTransactions, 'purchase'),
      toPointBenefitViewModel(reviewPointTransactions, 'review'),
    ].flatMap(benefit => (benefit ? [benefit] : [])),
  };
}

function toPointBenefitViewModel(
  transactions: readonly PointTransactionDTO[],
  type: MypageOrderPointBenefitViewModel['type'],
): MypageOrderPointBenefitViewModel | null {
  const earnedPointAmount = calculateEarnedPointAmount(transactions);

  return earnedPointAmount > 0
      ? {
        type,
        label: POINT_BENEFIT_LABELS[type],
        amountText: `+${formatKoreanPoints(earnedPointAmount)}`,
      }
    : null;
}
