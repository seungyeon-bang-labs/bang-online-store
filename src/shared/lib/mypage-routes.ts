export function getMypageOrderDetailHref(orderId: string): string {
  return `/mypage/orders/${orderId}`;
}

export function getMypageOrderClaimRequestHref(
  orderId: string,
  orderItemId: string,
): string {
  return `/mypage/orders/${orderId}/claim/${orderItemId}`;
}

export function getMypageOrderReceiptHref(
  orderId: string,
  type?: 'purchase' | 'card' | 'cash' | 'refund',
): string {
  const receiptHref = `/mypage/orders/${orderId}/receipt`;
  return type ? `${receiptHref}/${type}` : receiptHref;
}
