export const getCartItemCount = (items: readonly { quantity: number }[]): number =>
  items.reduce((total, item) => total + item.quantity, 0);

