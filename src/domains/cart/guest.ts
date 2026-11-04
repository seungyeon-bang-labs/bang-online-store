import { maxCartQuantity, type CartChange, type CartLine, type CartNotice, type CartProductResponse } from './contract';
import type { CartViewModel } from './view-model';
import { getChangedQuantity } from './domain';

export const pairKey = (item: { productId: number; variantId: number }) => `${item.productId}:${item.variantId}`;

// Applies one change to the latest stored lines; option choices are limited by the option dialog, so they are not re-checked here.
// Adds and option moves keep the quantity asked for, like the member cart; a quantity change follows the member
// rule when the line's stock is known (unknown keeps only the 1..max bounds).
export function applyGuestChange(
  lines: readonly CartLine[],
  change: CartChange,
  newId: () => string,
  stockOf: (variantId: number) => number | undefined = () => undefined,
): { status: 'saved'; lines: CartLine[]; itemIdMap?: Record<string, string> } | { status: 'missing' } {
  const next = lines.map(item => ({ ...item }));
  if (change.kind === 'add_items') {
    for (const input of change.items) {
      const existing = next.find(item => item.variantId === input.variantId);
      if (existing) existing.quantity = Math.min(existing.quantity + input.quantity, maxCartQuantity);
      else next.push({ id: newId(), productId: input.productId, variantId: input.variantId, quantity: input.quantity });
    }
    return { status: 'saved', lines: next };
  }
  if (change.kind === 'remove_items') {
    const kept = next.filter(item => !change.itemIds.includes(item.id));
    return kept.length === next.length ? { status: 'missing' } : { status: 'saved', lines: kept };
  }
  const source = next.find(item => item.id === change.itemId);
  if (!source) return { status: 'missing' };
  if (change.kind === 'adjust_quantity') {
    const stock = stockOf(source.variantId);
    source.quantity = stock === undefined
      ? Math.min(Math.max(1, source.quantity + change.delta), maxCartQuantity)
      : getChangedQuantity(source.quantity, change.delta, stock);
    return { status: 'saved', lines: next };
  }
  if (source.variantId === change.variantId) return { status: 'saved', lines: next };
  const target = next.find(item => item.variantId === change.variantId);
  if (target) {
    target.quantity = Math.min(target.quantity + source.quantity, maxCartQuantity);
    return { status: 'saved', lines: next.filter(item => item.id !== source.id), itemIdMap: { [source.id]: target.id } };
  }
  source.productId = change.productId;
  source.variantId = change.variantId;
  return { status: 'saved', lines: next };
}

// Only lines with no product data leave; discontinued lines and quantities above stock stay, and the line shows why
// it cannot be ordered.
export function buildGuestCart(
  lines: readonly CartLine[],
  products: CartProductResponse,
): { lines: CartLine[]; cart: CartViewModel; changed: boolean } {
  const byPair = new Map(products.cartItems.map(item => [pairKey(item), item]));
  const notices: CartNotice[] = [];
  const kept = lines.filter(item => {
    if (byPair.has(pairKey(item))) return true;
    notices.push({ kind: 'unavailable', itemId: item.id, variantId: item.variantId, before: item.quantity, after: 0 });
    return false;
  });
  const cart: CartViewModel = {
    owner: { kind: 'guest' },
    cartId: null,
    revision: null,
    items: kept.map(item => ({ ...byPair.get(pairKey(item))!, ...item })),
    optionGroups: products.optionGroups,
    notices,
    operation: null,
  };
  return { lines: kept.map(item => ({ ...item })), cart, changed: kept.length !== lines.length };
}
