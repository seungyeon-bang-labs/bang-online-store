import type { CartViewModel } from '@/domains/cart/cart.view-model';
import type { CartChange } from '@/domains/cart/cart.guest';

// Immediate member display only; the server reply replaces it, so merging and prices are left to the server.
export function previewChange(
  cart: CartViewModel,
  change: Exclude<CartChange, { kind: 'add_items' }>,
): CartViewModel {
  if (change.kind === 'remove_items') {
    return { ...cart, items: cart.items.filter(item => !change.itemIds.includes(item.id)) };
  }
  return {
    ...cart,
    items: cart.items.map(item => {
      if (item.id !== change.itemId) return item;
      if (change.kind === 'adjust_quantity') return { ...item, quantity: Math.max(1, item.quantity + change.delta) };
      const option = cart.optionGroups[item.styleId]?.find(product => product.productId === change.productId);
      const variant = option?.variants.find(value => value.id === change.variantId);
      return {
        ...item,
        productId: change.productId,
        variantId: change.variantId,
        ...(variant ? { size: variant.size } : {}),
        ...(option ? { color: option.color.label } : {}),
      };
    }),
  };
}
