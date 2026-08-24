export function getMypageOrderDetailHref(orderId: string): string {
  return `/mypage/orders/${orderId}`;
}

export function getMypageOrderClaimRequestHref(
  orderId: string,
  orderItemId: string,
): string {
  return `/mypage/orders/${orderId}/claim/${orderItemId}`;
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

export function resolveMypageOrderCancellationReturnHref(
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
