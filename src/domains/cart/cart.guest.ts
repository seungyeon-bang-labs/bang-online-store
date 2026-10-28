import type { CartProductResponse } from './cart.api';
import { maxCartQuantity as maxQuantity, type CartLine, type CartNotice, type CartProductInput } from './cart.contract';
import type { CartViewModel } from './cart.view-model';
import { getAdjustedQuantity } from './cart.rules';

export type CartChange =
  | { kind: 'add_items'; items: readonly CartProductInput[] }
  | { kind: 'adjust_quantity'; itemId: string; delta: 1 | -1 }
  | { kind: 'change_option'; itemId: string; productId: number; variantId: number }
  | { kind: 'remove_items'; itemIds: readonly string[] };

export const pairKey = (item: { productId: number; variantId: number }) => `${item.productId}:${item.variantId}`;

// Applies one change to the latest stored lines; option choices are limited by the option dialog, so they are not re-checked here.
export function applyGuestChange(
  lines: readonly CartLine[],
  change: CartChange,
  newId: () => string,
): { status: 'saved'; lines: CartLine[]; itemIdMap?: Record<string, string> } | { status: 'missing' } {
  const next = lines.map(item => ({ ...item }));
  if (change.kind === 'add_items') {
    for (const input of change.items) {
      const existing = next.find(item => item.variantId === input.variantId);
      if (existing) existing.quantity = Math.min(existing.quantity + input.quantity, maxQuantity);
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
    source.quantity = Math.min(Math.max(1, source.quantity + change.delta), maxQuantity);
    return { status: 'saved', lines: next };
  }
  if (source.variantId === change.variantId) return { status: 'saved', lines: next };
  const target = next.find(item => item.variantId === change.variantId);
  if (target) {
    target.quantity = Math.min(target.quantity + source.quantity, maxQuantity);
    return { status: 'saved', lines: next.filter(item => item.id !== source.id), itemIdMap: { [source.id]: target.id } };
  }
  source.productId = change.productId;
  source.variantId = change.variantId;
  return { status: 'saved', lines: next };
}

// Cleanup rules kept from the previous guest cart: unavailable products leave, quantities fit stock, sold-out lines stay unselectable.
export function buildGuestCart(
  lines: readonly CartLine[],
  products: CartProductResponse,
): { lines: CartLine[]; cart: CartViewModel; changed: boolean } {
  const byPair = new Map(products.cartItems.map(item => [pairKey(item), item]));
  const notices: CartNotice[] = [];
  const kept = lines.flatMap(item => {
    const available = byPair.get(pairKey(item));
    if (!available) {
      notices.push({ kind: 'unavailable', itemId: item.id, variantId: item.variantId, before: item.quantity, after: 0 });
      return [];
    }
    const quantity = getAdjustedQuantity(item.quantity, available.stock);
    if (quantity !== item.quantity) notices.push({ kind: 'quantity_adjusted', itemId: item.id, variantId: item.variantId, before: item.quantity, after: quantity });
    return [{ ...item, quantity }];
  });
  const cart: CartViewModel = {
    owner: { kind: 'guest' },
    cartId: null,
    revision: null,
    items: kept.map(item => {
      const available = byPair.get(pairKey(item))!;
      return { ...available, ...item, canSelect: available.stock > 0 };
    }),
    optionGroups: products.optionGroups,
    notices,
    operation: null,
  };
  return { lines: kept, cart, changed: JSON.stringify(kept) !== JSON.stringify(lines) };
}
