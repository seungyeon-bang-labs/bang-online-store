import type { CouponDTO } from '@/domains/coupon';
import {
  formatKoreanDate,
  formatKoreanMoney,
  formatKoreanMonthDay,
  formatKoreanPoints,
  formatKoreanTime,
} from '@/shared/lib/format';
import type { PageSlice } from '@/shared/lib/pagination';
import type { StatusViewModel } from '@/shared/types/status';
import {
  calculateEarnedThisMonth,
  calculatePointBalance,
  getNextPointExpiration,
  type PointListFilter,
  type PointListQuery,
} from './domain';
import type {
  MembershipTierDTO,
  PointTransactionDTO,
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
    currentTier: {
      currentTierName: currentTier.name,
      currentTierCode: currentTier.code,
      benefitSummary: currentTier.benefit_summary,
    },
    progress: {
      evaluationPurchaseText: formatKoreanMoney(
        membership.evaluation_purchase_amount,
      ),
      periodText: formatMembershipPeriod(
        membership.started_at,
        membership.expires_at,
      ),
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
    },
    membershipTiers: tiers.map(tier => ({
      id: tier.id,
      name: tier.name,
      minPurchaseText: formatKoreanMoney(tier.min_purchase_amount),
      pointRateText: tier.point_rate_percent + '%',
      benefitSummary: tier.benefit_summary,
      isCurrent: tier.id === currentTier.id,
    })),
  };
}

function formatMembershipPeriod(startedAt: string, expiresAt: string) {
  const startedDate = new Date(startedAt);
  const expiresDate = new Date(expiresAt);
  const startedText = formatKoreanDate(startedAt);
  const expiresText = formatKoreanDate(expiresAt);

  if (startedDate.getFullYear() !== expiresDate.getFullYear()) {
    return `${startedText} ~ ${expiresText}`;
  }

  return `${startedText} ~ ${expiresText.replace(/^\d{4}\.\s*/, '')}`;
}

export function toPointTransactionViewModel(
  row: PointTransactionDTO,
  description = row.description,
): PointTransactionViewModel {
  const absoluteText = Math.abs(row.amount).toLocaleString('ko-KR') + ' P';

  return {
    id: row.id,
    type: getPointTransactionStatus(row),
    description,
    showProductDetailIndicator:
      row.order_id !== null || row.review_id !== null,
    amountText: row.amount > 0 ? '+' + absoluteText : '-' + absoluteText,
    occurredDate: formatKoreanDate(row.occurred_at),
    occurredTime: formatKoreanTime(row.occurred_at),
  };
}

export function toPointPageViewModel(
  rows: readonly PointTransactionDTO[],
  query: PointListQuery,
  now = new Date(),
  descriptionsByTransactionId: ReadonlyMap<string, string> = new Map(),
): PointPageViewModel {
  const nextPointExpiration = getNextPointExpiration(rows, now);
  const filtered = rows.filter(
    row => matchesPointListFilter(row, query.filter),
  ).sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  const page = paginatePointTransactions(
    filtered.map(row =>
      toPointTransactionViewModel(
        row,
        descriptionsByTransactionId.get(row.id),
      ),
    ),
    query.page,
  );

  return {
    summary: {
      balanceText: formatKoreanPoints(calculatePointBalance(rows)),
      earnedThisMonthText: formatKoreanPoints(
        calculateEarnedThisMonth(rows, now),
      ),
      expiringDateText: nextPointExpiration
        ? formatKoreanMonthDay(nextPointExpiration.expiresAt)
        : null,
      expiringText: formatKoreanPoints(nextPointExpiration?.amount ?? 0),
    },
    transactionList: {
      dateGroups: groupPointTransactionsByDate(page.items),
      currentPage: page.currentPage,
      totalPages: page.totalPages,
      totalItems: page.totalItems,
      unfilteredItemCount: rows.length,
    },
  };
}

function groupPointTransactionsByDate(
  transactions: readonly PointTransactionViewModel[],
) {
  const transactionsByDate = Map.groupBy(
    transactions,
    transaction => transaction.occurredDate,
  );

  return Array.from(transactionsByDate, ([date, groupedTransactions]) => ({
    date,
    transactions: groupedTransactions,
  }));
}

function paginatePointTransactions(
  items: PointTransactionViewModel[],
  requestedPage: number,
): PageSlice<PointTransactionViewModel> {
  const pages = createPointTransactionPages(items, 10);
  const totalPages = Math.max(1, pages.length);
  const currentPage =
    requestedPage >= 1 && requestedPage <= totalPages ? requestedPage : 1;

  return {
    items: pages[currentPage - 1] ?? [],
    currentPage,
    totalPages,
    totalItems: items.length,
  };
}

function createPointTransactionPages(
  items: readonly PointTransactionViewModel[],
  pageSize: number,
): PointTransactionViewModel[][] {
  const pages: PointTransactionViewModel[][] = [];
  let startIndex = 0;

  while (startIndex < items.length) {
    let endIndex = Math.min(startIndex + pageSize, items.length);
    const lastItem = items[endIndex - 1];

    while (
      lastItem &&
      endIndex < items.length &&
      items[endIndex]?.occurredDate === lastItem.occurredDate
    ) {
      endIndex += 1;
    }

    pages.push(items.slice(startIndex, endIndex));
    startIndex = endIndex;
  }

  return pages;
}

function getPointTransactionStatus(
  row: PointTransactionDTO,
): StatusViewModel {
  if (row.transaction_type === 'use') {
    return { label: '사용', tone: 'info' };
  }

  if (row.transaction_type === 'expire') {
    return { label: '소멸', tone: 'danger' };
  }

  if (row.review_id) {
    return { label: '리뷰 적립', tone: 'success' };
  }

  if (row.order_id) {
    return { label: '구매 적립', tone: 'success' };
  }

  return { label: '기타 적립', tone: 'success' };
}

function matchesPointListFilter(
  row: PointTransactionDTO,
  filter: PointListFilter,
): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'purchase-earn':
      return row.transaction_type === 'earn' && row.order_id !== null;
    case 'review-earn':
      return row.transaction_type === 'earn' && row.review_id !== null;
    case 'other-earn':
      return (
        row.transaction_type === 'earn' &&
        row.order_id === null &&
        row.review_id === null
      );
    case 'use':
    case 'expire':
      return row.transaction_type === filter;
  }
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
