import type { CartItemViewModel, CartViewModel } from './view-model';

export const getCartItemCount = (items: readonly { quantity: number }[]): number =>
  items.reduce((total, item) => total + item.quantity, 0);

// Any line can be selected; a line that is not ok is shown with its reason and refused at checkout.
export type CartLineStatus = 'ok' | 'over_stock' | 'sold_out_all' | 'sold_out_option';

// Earlier checks win when states overlap (all options sold out includes the chosen one).
// Only a sold-out line scans the other options.
export function getCartLineStatus(
  item: Pick<CartItemViewModel, 'quantity' | 'stock' | 'styleId'>,
  optionGroups: CartViewModel['optionGroups'],
): CartLineStatus {
  if (item.quantity <= item.stock) return 'ok';
  if (item.stock > 0) return 'over_stock';
  const options = optionGroups[item.styleId] ?? [];
  return options.every(option => option.variants.every(variant => variant.stock === 0))
    ? 'sold_out_all'
    : 'sold_out_option';
}

// Same rules as apply_cart_operation. A change never goes below 1; one decrease from above stock lands on stock,
// and an increase never lowers a line already above it. A sold-out line is not changed.
export function getChangedQuantity(quantity: number, delta: 1 | -1, stock: number): number {
  if (stock === 0) return quantity;
  if (delta > 0) return Math.min(quantity + 1, Math.max(stock, quantity));
  return Math.min(Math.max(1, quantity - 1), stock);
}

// Only the added quantity is held to stock: a line already above stock keeps its quantity.
// Sold-out options cannot be chosen for an add, so stock 0 adds as asked.
export function getAddedQuantity(current: number, added: number, stock: number): number {
  if (stock === 0) return current + added;
  return Math.min(current + added, Math.max(stock, current));
}

export function reconcileSelection(
  selected: readonly string[],
  items: readonly CartItemViewModel[],
  itemIdMap: Record<string, string> = {},
): string[] {
  const present = new Set(items.map(item => item.id));
  return [...new Set(selected.map(id => itemIdMap[id] ?? id))]
    .filter(id => present.has(id));
}
