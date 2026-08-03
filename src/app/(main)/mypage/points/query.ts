import type { PointListQuery } from '@/domains/benefit';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

export interface PointsPageSearchParams {
  filter?: string | string[];
  page?: string | string[];
}

interface PointListHrefQuery {
  filter: PointListQuery['filter'];
  page: string | number;
}

const POINT_LIST_FILTER_VALUES = [
  'all',
  'purchase-earn',
  'review-earn',
  'other-earn',
  'use',
  'expire',
] as const satisfies readonly PointListQuery['filter'][];

const POINT_LIST_FILTER_LABELS: Record<PointListQuery['filter'], string> = {
  all: '전체',
  'purchase-earn': '구매 적립',
  'review-earn': '리뷰 적립',
  'other-earn': '기타 적립',
  use: '사용',
  expire: '소멸',
};

const POINT_LIST_FILTER_OPTIONS = POINT_LIST_FILTER_VALUES.map(value => ({
  value,
  label: POINT_LIST_FILTER_LABELS[value],
}));

export const POINT_LIST_FILTERS = [
  { id: 'filter', label: '적립금 유형', options: POINT_LIST_FILTER_OPTIONS },
] as const;

export function parsePointListQuery(
  searchParams: PointsPageSearchParams,
): PointListQuery {
  return {
    filter: parseQueryOption({
      value: firstQueryValue(searchParams.filter),
      options: POINT_LIST_FILTER_VALUES,
      fallback: 'all',
    }),
    page: parsePositivePage(searchParams.page),
  };
}

export function buildPointListHref(query: PointListHrefQuery): string {
  return buildQueryHref('/mypage/points', {
    filter: query.filter,
    page: query.page,
  });
}

export function buildPointListFilterHref(
  values: Readonly<Record<string, string>>,
): string {
  return buildPointListHref({
    filter: parseQueryOption({
      value: values.filter,
      options: POINT_LIST_FILTER_VALUES,
      fallback: 'all',
    }),
    page: 1,
  });
}
