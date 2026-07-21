import { DISCOUNTS } from './discount.fixture';

export const getProductDiscount = (productId: number) => {
  const activeDiscounts = DISCOUNTS.filter(rule => rule.isActive).sort(
    (a, b) => b.priority - a.priority,
  );

  for (const rule of activeDiscounts) {
    const discountItem = rule.items.find(item =>
      item.productIds.includes(productId),
    );

    if (discountItem) {
      return discountItem.discountRate;
    }
  }

  return 0;
};

