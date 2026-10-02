import type { InquiryDTO, InquiryStatus, InquiryType } from './dto';
import type { OrderDTO, OrderItemDTO } from '@/domains/order/dto';
import type { ProductModel } from '@/domains/product';

export type InquiryWriteEntryContext =
  | { orderId: string; orderItemId?: string }
  | { productId: number };

export const INQUIRY_TYPES = [
  'order',
  'delivery',
  'return',
  'product',
  'coupon',
  'account',
  'etc',
] as const;

export const INQUIRY_TYPE_FILTERS = ['all', ...INQUIRY_TYPES] as const;

export const INQUIRY_STATUS_FILTERS = [
  'all',
  'pending',
  'answered',
] as const;

export const INQUIRY_PAGE_SIZE = 10;
export const INQUIRY_TITLE_MIN_LENGTH = 2;
export const INQUIRY_TITLE_MAX_LENGTH = 100;
export const INQUIRY_CONTENT_MIN_LENGTH = 10;
export const INQUIRY_CONTENT_MAX_LENGTH = 500;

export type InquiryTypeFilter = (typeof INQUIRY_TYPE_FILTERS)[number];
export type InquiryStatusFilter = (typeof INQUIRY_STATUS_FILTERS)[number];

export const INQUIRY_PRODUCT_CATEGORY_FILTERS = [
  'all',
  'outer',
  'top',
  'bottom',
  'acc-shoes',
] as const;

export type InquiryProductCategoryFilter =
  (typeof INQUIRY_PRODUCT_CATEGORY_FILTERS)[number];

export const INQUIRY_PRODUCT_CATEGORY_FILTER_LABELS: Record<
  InquiryProductCategoryFilter,
  string
> = {
  all: '전체',
  outer: '아우터',
  top: '상의',
  bottom: '하의',
  'acc-shoes': '잡화·신발',
};

export type InquiryContextRequirement =
  | 'none'
  | 'order'
  | 'order-item'
  | 'product';

export interface InquiryWriteContextState {
  orderId: string;
  orderItemId: string;
  productId: string;
}

export interface InquiryWriteContextOption {
  id: string;
  items: readonly {
    id: string;
    productId: number;
  }[];
}

export interface ResolvedInquiryWriteContext {
  orderId: string;
  orderItemId: string;
  productId: string;
  orderIdForItemSelection: string;
}

export const INQUIRY_TYPE_CONTEXT_REQUIREMENTS: Record<
  InquiryType,
  InquiryContextRequirement
> = {
  order: 'order',
  delivery: 'order',
  return: 'order-item',
  product: 'product',
  coupon: 'none',
  account: 'none',
  etc: 'none',
};

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

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: '답변대기',
  answered: '답변완료',
  cancelled: '문의 취소',
};

export const INQUIRY_STATUS_FILTER_LABELS: Record<
  InquiryStatusFilter,
  string
> = {
  all: '전체',
  pending: INQUIRY_STATUS_LABELS.pending,
  answered: INQUIRY_STATUS_LABELS.answered,
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

export interface InquiryTextInput {
  title: string;
  content: string;
}

export interface InquiryTextValidation {
  isTitleValid: boolean;
  isContentValid: boolean;
}

export function getInquiryActionEligibility(
  status: InquiryStatus,
): InquiryActionEligibility {
  return {
    canEdit: status === 'pending',
    canCancel: status === 'pending',
  };
}

export function isVisibleInquiryStatus(status: InquiryStatus): boolean {
  return status !== 'cancelled';
}

export function validateInquiryTextInput({
  title,
  content,
}: InquiryTextInput): InquiryTextValidation {
  const titleLength = title.trim().length;
  const contentLength = content.trim().length;

  return {
    isTitleValid:
      titleLength >= INQUIRY_TITLE_MIN_LENGTH &&
      titleLength <= INQUIRY_TITLE_MAX_LENGTH,
    isContentValid:
      contentLength >= INQUIRY_CONTENT_MIN_LENGTH &&
      contentLength <= INQUIRY_CONTENT_MAX_LENGTH,
  };
}

export function getInquiryContextRequirement(
  type: InquiryType,
): InquiryContextRequirement {
  return INQUIRY_TYPE_CONTEXT_REQUIREMENTS[type];
}

export function resolveInquiryWriteContext({
  state,
  orders,
}: {
  state: InquiryWriteContextState;
  orders: readonly InquiryWriteContextOption[];
}): ResolvedInquiryWriteContext {
  const order = orders.find(candidate => candidate.id === state.orderId);
  const orderItem = order?.items.find(
    candidate => candidate.id === state.orderItemId,
  );
  const singleOrderItem =
    order?.items.length === 1 ? (order.items[0] ?? null) : null;
  const selectedOrderItem = orderItem ?? singleOrderItem;

  return {
    orderId: order?.id ?? '',
    orderItemId: selectedOrderItem?.id ?? '',
    productId:
      state.productId ||
      (selectedOrderItem ? String(selectedOrderItem.productId) : ''),
    orderIdForItemSelection:
      order && order.items.length > 1 && !orderItem ? order.id : '',
  };
}

export function hasValidInquiryWriteEntryContext(
  entryContext: InquiryWriteEntryContext | null,
  orders: readonly OrderDTO[],
  items: readonly OrderItemDTO[],
  products: readonly ProductModel[],
): boolean {
  if (!entryContext) return true;

  if ('orderId' in entryContext) {
    if (!orders.some(order => order.id === entryContext.orderId)) return false;

    return (
      !entryContext.orderItemId ||
      items.some(
        item =>
          item.id === entryContext.orderItemId &&
          item.order_id === entryContext.orderId,
      )
    );
  }

  return products.some(product => product.id === entryContext.productId);
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
