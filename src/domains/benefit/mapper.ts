import type { CouponDTO } from '@/domains/coupon';
import {
  formatKoreanDate,
  formatKoreanMoney,
  formatKoreanPoints,
} from '@/shared/lib/format';
import { paginate } from '@/shared/lib/pagination';
import type { StatusViewModel } from '@/shared/types/status';
import {
  calculateEarnedThisMonth,
  calculateExpiringPoints,
  calculatePointBalance,
  type PointListQuery,
} from './domain';
import type {
  MembershipTierDTO,
  PointTransactionDTO,
  PointTransactionType,
  UserCouponDTO,
  UserCouponStatus,
  UserMembershipDTO,
} from './dto';
import type {
  MembershipViewModel,
  PointPageViewModel,
  PointTransactionViewModel,
  UserCouponViewModel,
} from './view-model';

export function toMembershipViewModel(
  membership: UserMembershipDTO,
  currentTier: MembershipTierDTO,
  nextTier: MembershipTierDTO | null,
  tiers: MembershipTierDTO[],
): MembershipViewModel {
  const range = nextTier
    ? nextTier.min_purchase_amount - currentTier.min_purchase_amount
    : 0;
  const progress = nextTier
    ? ((membership.evaluation_purchase_amount -
        currentTier.min_purchase_amount) /
        range) *
      100
    : 100;

  return {
    currentTierName: currentTier.name,
    currentTierCode: currentTier.code,
    pointRateText: currentTier.point_rate_percent + '%',
    benefitSummary: currentTier.benefit_summary,
    evaluationPurchaseText: formatKoreanMoney(
      membership.evaluation_purchase_amount,
    ),
    periodText:
      formatKoreanDate(membership.started_at) +
      ' ~ ' +
      formatKoreanDate(membership.expires_at),
    nextTierName: nextTier?.name ?? null,
    remainingAmountText: nextTier
      ? formatKoreanMoney(
          Math.max(
            0,
            nextTier.min_purchase_amount -
              membership.evaluation_purchase_amount,
          ),
        )
      : null,
    progressPercent: Math.min(100, Math.max(0, progress)),
    tiers: tiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      minPurchaseText: formatKoreanMoney(tier.min_purchase_amount),
      pointRateText: tier.point_rate_percent + '%',
      benefitSummary: tier.benefit_summary,
      isCurrent: tier.id === currentTier.id,
    })),
  };
}

export function toPointTransactionViewModel(
  row: PointTransactionDTO,
): PointTransactionViewModel {
  const statusByType: Record<PointTransactionType, StatusViewModel> = {
    earn: { label: '적립', tone: 'success' },
    use: { label: '사용', tone: 'info' },
    expire: { label: '소멸', tone: 'danger' },
  };
  const absoluteText = Math.abs(row.amount).toLocaleString('ko-KR') + ' P';

  return {
    id: row.id,
    type: statusByType[row.transaction_type],
    description: row.description,
    amountText: row.amount > 0 ? '+' + absoluteText : '-' + absoluteText,
    occurredAt: formatKoreanDate(row.occurred_at),
    expiresAt: row.expires_at ? formatKoreanDate(row.expires_at) : null,
  };
}

export function toPointPageViewModel(
  rows: readonly PointTransactionDTO[],
  query: PointListQuery,
  now = new Date(),
): PointPageViewModel {
  const filtered = rows.filter(
    row => query.type === 'all' || row.transaction_type === query.type,
  );
  const page = paginate(
    filtered.map(toPointTransactionViewModel),
    query.page,
    5,
  );

  return {
    ...page,
    balanceText: formatKoreanPoints(calculatePointBalance(rows)),
    earnedThisMonthText: formatKoreanPoints(
      calculateEarnedThisMonth(rows, now),
    ),
    expiringText: formatKoreanPoints(calculateExpiringPoints(rows, now)),
  };
}

export function toUserCouponViewModel(
  row: UserCouponDTO,
  coupon: CouponDTO,
  statusCode: UserCouponStatus,
): UserCouponViewModel {
  return {
    id: row.id,
    name: coupon.name,
    statusCode,
    status: toUserCouponStatusViewModel(statusCode),
    discountText: toCouponDiscountText(coupon),
    conditionText:
      coupon.min_order_amount > 0
        ? formatKoreanMoney(coupon.min_order_amount) + ' 이상 구매 시'
        : '금액 제한 없음',
    expiresAt: formatKoreanDate(row.expires_at),
    usedAt: row.used_at ? formatKoreanDate(row.used_at) : null,
  };
}

function toUserCouponStatusViewModel(
  status: UserCouponStatus,
): StatusViewModel {
  const values: Record<UserCouponStatus, StatusViewModel> = {
    available: { label: '사용 가능', tone: 'success' },
    used: { label: '사용 완료', tone: 'neutral' },
    expired: { label: '기간 만료', tone: 'danger' },
  };

  return values[status];
}

function toCouponDiscountText(coupon: CouponDTO): string {
  switch (coupon.discount_type) {
    case 'percentage':
      return coupon.discount_value + '% 할인';
    case 'fixed':
      return formatKoreanMoney(coupon.discount_value) + ' 할인';
    case 'free_shipping':
      return '무료 배송';
  }
}
