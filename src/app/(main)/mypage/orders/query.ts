import {
  ORDER_PERIODS,
  ORDER_STATUS_FILTERS,
  toOrderStatusViewModel,
} from '@/domains/order';
import type { OrderListQuery } from '@/domains/order';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

export interface OrdersPageSearchParams {
  period?: string | string[];
  status?: string | string[];
  page?: string | string[];
}

interface OrderListHrefQuery {
  period: OrderListQuery['period'];
  status: OrderListQuery['status'];
  page: string | number;
}

const ORDER_PERIOD_LINKS = [
  { value: '1-month', label: '1개월' },
  { value: '3-months', label: '3개월' },
  { value: '6-months', label: '6개월' },
  { value: '12-months', label: '12개월' },
  { value: 'all', label: '전체' },
] as const;

const ORDER_STATUS_LINKS = ORDER_STATUS_FILTERS.map(value => ({
  value,
  label: value === 'all' ? '전체' : toOrderStatusViewModel(value).label,
}));

export const ORDER_LIST_FILTERS = [
  { id: 'period', label: '조회 기간', options: ORDER_PERIOD_LINKS },
  { id: 'status', label: '주문 상태', options: ORDER_STATUS_LINKS },
] as const;

export function parseOrderListQuery(
  searchParams: OrdersPageSearchParams,
): OrderListQuery {
  return {
    period: parseQueryOption({
      value: firstQueryValue(searchParams.period),
      options: ORDER_PERIODS,
      fallback: '3-months',
    }),
    status: parseQueryOption({
      value: firstQueryValue(searchParams.status),
      options: ORDER_STATUS_FILTERS,
      fallback: 'all',
    }),
    page: parsePositivePage(searchParams.page),
  };
}

export function buildOrderListHref(query: OrderListHrefQuery): string {
  return buildQueryHref('/mypage/orders', {
    period: query.period,
    status: query.status,
    page: query.page,
  });
}

export function buildOrderListFilterHref(
  values: Readonly<Record<string, string>>,
): string {
  return buildOrderListHref({
    period: parseQueryOption({
      value: values.period,
      options: ORDER_PERIODS,
      fallback: '3-months',
    }),
    status: parseQueryOption({
      value: values.status,
      options: ORDER_STATUS_FILTERS,
      fallback: 'all',
    }),
    page: 1,
  });
}
