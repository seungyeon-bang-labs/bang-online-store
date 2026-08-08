import {
  INQUIRY_STATUS_FILTER_LABELS,
  INQUIRY_STATUS_FILTERS,
  INQUIRY_TYPE_FILTER_LABELS,
  INQUIRY_TYPE_FILTERS,
  type InquiryListQuery,
} from '@/domains/inquiry';
import {
  buildQueryHref,
  firstQueryValue,
  parsePositivePage,
  parseQueryOption,
} from '@/shared/lib/query';

export interface InquiriesPageSearchParams {
  type?: string | string[];
  status?: string | string[];
  page?: string | string[];
}

interface InquiryListHrefQuery {
  type: InquiryListQuery['type'];
  status: InquiryListQuery['status'];
  page: string | number;
}

const INQUIRY_TYPE_LINKS = INQUIRY_TYPE_FILTERS.map(value => ({
  value,
  label: INQUIRY_TYPE_FILTER_LABELS[value],
}));

const INQUIRY_STATUS_LINKS = INQUIRY_STATUS_FILTERS.map(value => ({
  value,
  label: INQUIRY_STATUS_FILTER_LABELS[value],
}));

export const INQUIRY_LIST_FILTERS = [
  { id: 'type', label: '문의 유형', options: INQUIRY_TYPE_LINKS },
  { id: 'status', label: '답변 상태', options: INQUIRY_STATUS_LINKS },
] as const;

export function parseInquiryListQuery(
  searchParams: InquiriesPageSearchParams,
): InquiryListQuery {
  return {
    type: parseQueryOption({
      value: firstQueryValue(searchParams.type),
      options: INQUIRY_TYPE_FILTERS,
      fallback: 'all',
    }),
    status: parseQueryOption({
      value: firstQueryValue(searchParams.status),
      options: INQUIRY_STATUS_FILTERS,
      fallback: 'all',
    }),
    page: parsePositivePage(searchParams.page),
  };
}

export function buildInquiryListHref(query: InquiryListHrefQuery): string {
  return buildQueryHref('/mypage/inquiries', {
    type: query.type,
    status: query.status,
    page: query.page,
  });
}

export function buildInquiryListFilterHref(
  values: Readonly<Record<string, string>>,
): string {
  return buildInquiryListHref({
    type: parseQueryOption({
      value: values.type,
      options: INQUIRY_TYPE_FILTERS,
      fallback: 'all',
    }),
    status: parseQueryOption({
      value: values.status,
      options: INQUIRY_STATUS_FILTERS,
      fallback: 'all',
    }),
    page: 1,
  });
}
