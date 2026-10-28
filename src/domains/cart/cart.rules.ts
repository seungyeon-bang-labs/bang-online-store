import type { CartItemViewModel } from './cart.view-model';

export function getAdjustedQuantity(quantity: number, stock: number): number {
  return stock === 0 ? quantity : Math.min(quantity, stock);
}

export function reconcileSelection(
  selected: readonly string[],
  items: readonly CartItemViewModel[],
  itemIdMap: Record<string, string> = {},
): string[] {
  const selectable = new Set(items.filter(item => item.canSelect).map(item => item.id));
  return [...new Set(selected.map(id => itemIdMap[id] ?? id))]
    .filter(id => selectable.has(id));
}
