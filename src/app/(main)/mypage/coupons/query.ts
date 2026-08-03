import type { UserCouponListQuery } from '@/domains/benefit';
import { USER_COUPON_TABS } from '@/domains/benefit';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

export interface CouponsPageSearchParams {
  tab?: string | string[];
  page?: string | string[];
}

interface CouponListHrefQuery {
  tab: UserCouponListQuery['tab'];
  page: string | number;
}

const USER_COUPON_TAB_LABELS: Record<UserCouponListQuery['tab'], string> = {
  all: '전체',
  available: '사용 가능',
  used: '사용 완료',
  expired: '기간 만료',
};

const USER_COUPON_TAB_OPTIONS = USER_COUPON_TABS.map(value => ({
  value,
  label: USER_COUPON_TAB_LABELS[value],
}));

export const USER_COUPON_FILTERS = [
  {
    id: 'tab',
    label: '쿠폰 상태',
    options: USER_COUPON_TAB_OPTIONS,
  },
] as const;

export function parseCouponListQuery(
  searchParams: CouponsPageSearchParams,
): UserCouponListQuery {
  return {
    tab: parseQueryOption({
      value: firstQueryValue(searchParams.tab),
      options: USER_COUPON_TABS,
      fallback: 'available',
    }),
    page: parsePositivePage(searchParams.page),
  };
}

export function buildCouponListHref(query: CouponListHrefQuery): string {
  return buildQueryHref('/mypage/coupons', {
    tab: query.tab,
    page: query.page,
  });
}

export function buildCouponListFilterHref(
  values: Readonly<Record<string, string>>,
): string {
  return buildCouponListHref({
    tab: parseQueryOption({
      value: values.tab,
      options: USER_COUPON_TABS,
      fallback: 'available',
    }),
    page: 1,
  });
}
