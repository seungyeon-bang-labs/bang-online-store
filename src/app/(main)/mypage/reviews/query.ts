import {
  REVIEW_TABS,
  type ReviewListQuery,
} from '@/domains/activity';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

export interface ReviewsPageSearchParams {
  tab?: string | string[];
  page?: string | string[];
}

interface ReviewListHrefQuery {
  tab: ReviewListQuery['tab'];
  page: string | number;
}

export function getReviewListFilters(availableCount: number) {
  return [
    {
      id: 'tab',
      label: '리뷰 상태',
      options: REVIEW_TABS.map(value => ({
        value,
        label:
          value === 'available'
            ? `작성 가능 ${availableCount}`
            : '작성 완료',
      })),
    },
  ] as const;
}

export function parseReviewListQuery(
  searchParams: ReviewsPageSearchParams,
): ReviewListQuery {
  return {
    tab: parseQueryOption({
      value: firstQueryValue(searchParams.tab),
      options: REVIEW_TABS,
      fallback: 'available',
    }),
    page: parsePositivePage(searchParams.page),
  };
}

export function buildReviewListHref(query: ReviewListHrefQuery): string {
  return buildQueryHref('/mypage/reviews', {
    tab: query.tab,
    page: query.page,
  });
}

export function buildReviewListFilterHref(
  values: Readonly<Record<string, string>>,
): string {
  return buildReviewListHref({
    tab: parseQueryOption({
      value: values.tab,
      options: REVIEW_TABS,
      fallback: 'available',
    }),
    page: 1,
  });
}
