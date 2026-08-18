import type { InquiryDTO, InquiryStatus } from './dto';

export const INQUIRY_TYPE_FILTERS = [
  'all',
  'order',
  'delivery',
  'return',
  'product',
  'coupon',
  'account',
  'etc',
] as const;

export const INQUIRY_STATUS_FILTERS = [
  'all',
  'pending',
  'answered',
] as const;

export const INQUIRY_PAGE_SIZE = 10;

export type InquiryTypeFilter = (typeof INQUIRY_TYPE_FILTERS)[number];
export type InquiryStatusFilter = (typeof INQUIRY_STATUS_FILTERS)[number];

export const INQUIRY_TYPE_FILTER_LABELS: Record<
  InquiryTypeFilter,
  string
> = {
  all: '전체',
  order: '주문/결제',
  delivery: '배송',
  return: '교환·반품',
  product: '상품',
  coupon: '쿠폰/이벤트',
  account: '회원/계정',
  etc: '기타',
};

export const INQUIRY_STATUS_FILTER_LABELS: Record<
  InquiryStatusFilter,
  string
> = {
  all: '전체',
  pending: '답변대기',
  answered: '답변완료',
};

export interface InquiryListQuery {
  type: InquiryTypeFilter;
  status: InquiryStatusFilter;
  page: number;
}

export interface InquiryActionEligibility {
  canEdit: boolean;
  canCancel: boolean;
}

export function getInquiryActionEligibility(
  status: InquiryStatus,
): InquiryActionEligibility {
  return {
    canEdit: status === 'pending',
    canCancel: status === 'pending',
  };
}

export function filterInquiries(
  rows: readonly InquiryDTO[],
  query: Pick<InquiryListQuery, 'type' | 'status'>,
): InquiryDTO[] {
  return rows
    .filter(row => query.type === 'all' || row.inquiry_type === query.type)
    .filter(row => query.status === 'all' || row.status === query.status)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}
