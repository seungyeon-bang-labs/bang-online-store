import type { InquiryDTO } from './dto';

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

export interface InquiryListQuery {
  type: (typeof INQUIRY_TYPE_FILTERS)[number];
  status: (typeof INQUIRY_STATUS_FILTERS)[number];
  page: number;
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
