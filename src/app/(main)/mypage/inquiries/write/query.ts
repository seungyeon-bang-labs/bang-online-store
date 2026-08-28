import { firstQueryValue } from '@/shared/lib/query';
import type { InquiryWriteEntryContext } from '@/domains/inquiry';

export interface InquiryWritePageSearchParams {
  orderId?: string | string[];
  orderItemId?: string | string[];
  productId?: string | string[];
  returnTo?: string | string[];
}

export type InquiryWritePageQuery =
  | {
      kind: 'valid';
      entryContext: InquiryWriteEntryContext | null;
      returnTo?: string;
    }
  | { kind: 'invalid' };

export function parseInquiryWritePageQuery(
  searchParams: InquiryWritePageSearchParams,
): InquiryWritePageQuery {
  const orderId = firstQueryValue(searchParams.orderId);
  const orderItemId = firstQueryValue(searchParams.orderItemId);
  const productId = firstQueryValue(searchParams.productId);
  const returnTo = firstQueryValue(searchParams.returnTo);

  if (productId && (orderId || orderItemId)) return { kind: 'invalid' };
  if (orderItemId && !orderId) return { kind: 'invalid' };

  if (productId) {
    const parsedProductId = Number(productId);

    if (!Number.isSafeInteger(parsedProductId) || parsedProductId <= 0) {
      return { kind: 'invalid' };
    }

    return {
      kind: 'valid',
      entryContext: { productId: parsedProductId },
      returnTo,
    };
  }

  return {
    kind: 'valid',
    entryContext: orderId ? { orderId, orderItemId } : null,
    returnTo,
  };
}
