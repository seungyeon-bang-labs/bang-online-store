const CART_HREF = '/cart';
const CART_FALLBACK_HREF = '/';

export function getCartHref(returnTo?: string): string {
  return returnTo
    ? `${CART_HREF}?returnTo=${encodeURIComponent(returnTo)}`
    : CART_HREF;
}

export function resolveCartReturnHref(returnTo?: string | null): string {
  if (
    !returnTo ||
    !returnTo.startsWith('/') ||
    returnTo.startsWith('//') ||
    returnTo.split('?')[0] === CART_HREF
  ) {
    return CART_FALLBACK_HREF;
  }

  return returnTo;
}
