const CHECKOUT_HREF = '/checkout';

export function getCheckoutHref(cartItemIds: readonly string[]): string {
  return `${CHECKOUT_HREF}?items=${cartItemIds.map(encodeURIComponent).join(',')}`;
}

// The checkout page checks every id against the member's current cart; this only splits the query.
export function parseCheckoutItemIds(items?: string | string[]): string[] {
  const value = Array.isArray(items) ? items.join(',') : items ?? '';

  return [...new Set(value.split(',').map(id => id.trim()).filter(Boolean))];
}
