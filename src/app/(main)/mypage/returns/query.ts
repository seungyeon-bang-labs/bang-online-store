import {
  ORDER_CLAIM_STATUS_FILTERS,
  ORDER_CLAIM_TYPE_FILTERS,
  toOrderClaimStatusViewModel,
  toOrderClaimTypeViewModel,
} from '@/domains/order/claim';
import type { OrderClaimListQuery } from '@/domains/order/claim/domain';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

export interface ReturnsPageSearchParams {
  type?: string | string[];
  status?: string | string[];
  page?: string | string[];
}

interface OrderClaimListHrefQuery {
  type: OrderClaimListQuery['type'];
  status: OrderClaimListQuery['status'];
  page: number;
}

const ORDER_CLAIM_TYPE_LINKS = ORDER_CLAIM_TYPE_FILTERS.map(value => ({
  value,
  label: value === 'all' ? '전체' : toOrderClaimTypeViewModel(value).label,
}));

const ORDER_CLAIM_STATUS_LINKS = ORDER_CLAIM_STATUS_FILTERS.map(value => ({
  value,
  label:
    value === 'all' ? '전체' : toOrderClaimStatusViewModel(value).label,
}));

export const ORDER_CLAIM_LIST_FILTERS = [
  { id: 'type', label: '요청 유형', options: ORDER_CLAIM_TYPE_LINKS },
  { id: 'status', label: '처리 상태', options: ORDER_CLAIM_STATUS_LINKS },
] as const;

export function parseOrderClaimListQuery(
  searchParams: ReturnsPageSearchParams,
): OrderClaimListQuery {
  return {
    type: parseQueryOption({
      value: firstQueryValue(searchParams.type),
      options: ORDER_CLAIM_TYPE_FILTERS,
      fallback: 'all',
    }),
    status: parseQueryOption({
      value: firstQueryValue(searchParams.status),
      options: ORDER_CLAIM_STATUS_FILTERS,
      fallback: 'all',
    }),
    page: parsePositivePage(searchParams.page),
  };
}

export function buildOrderClaimListHref(
  query: OrderClaimListHrefQuery,
): string {
  return buildQueryHref('/mypage/returns', {
    type: query.type,
    status: query.status,
    page: query.page,
  });
}

export function buildOrderClaimListFilterHref(
  values: Readonly<Record<string, string>>,
): string {
  return buildOrderClaimListHref({
    type: parseQueryOption({
      value: values.type,
      options: ORDER_CLAIM_TYPE_FILTERS,
      fallback: 'all',
    }),
    status: parseQueryOption({
      value: values.status,
      options: ORDER_CLAIM_STATUS_FILTERS,
      fallback: 'all',
    }),
    page: 1,
  });
}
