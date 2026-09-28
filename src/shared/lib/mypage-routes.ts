export function getMypageOrderDetailHref(orderId: string): string {
  return `/mypage/orders/${orderId}`;
}

export function getMypageAddressHref(): string {
  return '/mypage/address';
}

export function getMypageAddressWriteHref(): string {
  return '/mypage/address/write';
}

export function getMypageAddressEditHref(addressId: string): string {
  return `/mypage/address/${addressId}/edit`;
}

export function getMypageOrderClaimRequestHref(
  orderId: string,
  orderItemId: string,
  returnTo?: string,
): string {
  const claimRequestHref = `/mypage/orders/${orderId}/claim/${orderItemId}`;
  return returnTo
    ? `${claimRequestHref}?returnTo=${encodeURIComponent(returnTo)}`
    : claimRequestHref;
}

export function getMypageReviewWriteHref(
  orderItemId: string,
  returnTo?: string,
): string {
  const reviewWriteHref = `/mypage/reviews/write/${orderItemId}`;
  return returnTo
    ? `${reviewWriteHref}?returnTo=${encodeURIComponent(returnTo)}`
    : reviewWriteHref;
}

export function getMypageReviewEditHref(
  reviewId: string,
  returnTo?: string,
): string {
  const reviewEditHref = `/mypage/reviews/${reviewId}/edit`;
  return returnTo
    ? `${reviewEditHref}?returnTo=${encodeURIComponent(returnTo)}`
    : reviewEditHref;
}

export function getMypageCompletedReviewListHref(): string {
  return '/mypage/reviews?tab=completed&page=1';
}

export function getMypageCancelledOrderListHref(): string {
  return '/mypage/orders?period=all&status=cancelled&includePartialCancellation=true&page=1';
}

export function getMypageOrderClaimListHref(): string {
  return '/mypage/returns?type=all&status=all&page=1';
}

export function getMypageInquiryListHref(): string {
  return '/mypage/inquiries?type=all&status=all&page=1';
}

export function getMypageOrderCancellationHref(
  orderId: string,
  orderItemId: string,
  returnTo?: string,
): string {
  const cancellationHref = `/mypage/orders/${orderId}/cancel/${orderItemId}`;
  return returnTo
    ? `${cancellationHref}?returnTo=${encodeURIComponent(returnTo)}`
    : cancellationHref;
}

export function getMypageInquiryWriteHref({
  orderId,
  orderItemId,
  productId,
  returnTo,
}: {
  orderId?: string;
  orderItemId?: string;
  productId?: number;
  returnTo?: string;
} = {}): string {
  const search = new URLSearchParams();

  if (orderId) {
    search.set('orderId', orderId);
    if (orderItemId) search.set('orderItemId', orderItemId);
  } else if (productId) {
    search.set('productId', String(productId));
  }
  if (returnTo) search.set('returnTo', returnTo);

  const query = search.toString();
  return query ? `/mypage/inquiries/write?${query}` : '/mypage/inquiries/write';
}

export function getMypageInquiryEditHref(
  inquiryId: string,
  returnTo?: string,
): string {
  const editHref = `/mypage/inquiries/${inquiryId}/edit`;
  return returnTo
    ? `${editHref}?returnTo=${encodeURIComponent(returnTo)}`
    : editHref;
}

export function resolveMypageInquiryWriteReturnHref({
  orderId,
  returnTo,
}: {
  orderId?: string;
  returnTo?: string;
}): string {
  const fallbackHref = '/mypage/inquiries';
  if (!returnTo) return fallbackHref;

  const returnPathname = returnTo.split('?')[0];
  const orderDetailHref = orderId
    ? getMypageOrderDetailHref(orderId)
    : null;
  const isAllowedPath =
    returnPathname === '/mypage' ||
    returnPathname === '/mypage/inquiries' ||
    returnPathname === '/mypage/orders' ||
    returnPathname === orderDetailHref;

  return isAllowedPath ? returnTo : fallbackHref;
}

export function resolveMypageInquiryEditReturnHref({
  returnTo,
}: {
  returnTo?: string;
}): string {
  const fallbackHref = '/mypage/inquiries?type=all&status=all&page=1';
  if (!returnTo) return fallbackHref;

  return returnTo.split('?')[0] === '/mypage/inquiries'
    ? returnTo
    : fallbackHref;
}

export function resolveMypageOrderCancellationReturnHref(
  orderId: string,
  returnTo?: string | string[],
): string {
  return resolveMypageOrderItemActionReturnHref(orderId, returnTo);
}

export function resolveMypageOrderClaimRequestReturnHref(
  orderId: string,
  returnTo?: string | string[],
): string {
  return resolveMypageOrderItemActionReturnHref(orderId, returnTo);
}

export function resolveMypageReviewReturnHref({
  orderId,
  returnTo,
  fallbackHref,
}: {
  orderId: string;
  returnTo?: string | string[];
  fallbackHref: string;
}): string {
  if (typeof returnTo !== 'string') return fallbackHref;

  const returnPathname = returnTo.split('?')[0];
  const orderDetailHref = getMypageOrderDetailHref(orderId);
  return returnPathname === '/mypage' ||
    returnPathname === '/mypage/reviews' ||
    returnPathname === '/mypage/orders' ||
    returnPathname === orderDetailHref
    ? returnTo
    : fallbackHref;
}

function resolveMypageOrderItemActionReturnHref(
  orderId: string,
  returnTo?: string | string[],
): string {
  const orderDetailHref = getMypageOrderDetailHref(orderId);
  if (typeof returnTo !== 'string') return orderDetailHref;

  const returnPathname = returnTo.split('?')[0];
  return returnPathname === '/mypage' ||
    returnPathname === '/mypage/orders' ||
    returnPathname === orderDetailHref
    ? returnTo
    : orderDetailHref;
}

export function getMypageOrderClaimDetailHref(claimId: string): string {
  return `/mypage/returns/${claimId}`;
}

export function getMypageOrderReceiptHref(
  orderId: string,
  type?: 'purchase' | 'card' | 'cash' | 'refund',
): string {
  const receiptHref = `/mypage/orders/${orderId}/receipt`;
  return type ? `${receiptHref}/${type}` : receiptHref;
}
