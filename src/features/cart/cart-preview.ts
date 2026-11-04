import type { CartChange } from '@/domains/cart/contract';
import { getChangeableStock, getChangedQuantity } from '@/domains/cart/domain';
import type { CartViewModel } from '@/domains/cart/view-model';

// Immediate display until the server reply replaces it. Merging lines is left to the server.
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
      if (change.kind === 'adjust_quantity') return { ...item, quantity: getChangedQuantity(item.quantity, change.delta, getChangeableStock(item)) };
      const option = cart.optionGroups[item.styleId]?.find(product => product.productId === change.productId);
      const variant = option?.variants.find(value => value.id === change.variantId);
      return {
        ...item,
        productId: change.productId,
        variantId: change.variantId,
        // The whole new option, so the card never mixes it with the old one until the reply.
        ...(option ? { name: option.name, thumbnailUrl: option.thumbnailUrl, price: option.price, discountRate: option.discountRate, color: option.color.label } : {}),
        ...(variant ? { size: variant.size, stock: variant.stock, priceOffset: variant.priceOffset } : {}),
      };
    }),
  };
}
