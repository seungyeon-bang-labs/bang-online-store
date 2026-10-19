import type { ProductModel, ProductVariantModel } from './model';

export const isProductSoldOut = (variants: readonly ProductVariantModel[]) =>
  variants.every(variant => variant.stock <= 0);

export const getDiscountedPrice = (price: number, discountRate: number) =>
  Math.floor((price * (100 - discountRate)) / 100);

export function getProductLinePrice(
  price: number,
  discountRate: number,
  priceOffset: number,
  quantity: number,
) {
  const unitPrice = getDiscountedPrice(price, discountRate) + priceOffset;
  const total = unitPrice * quantity;
  const originalTotal = (price + priceOffset) * quantity;
  return { unitPrice, total, originalTotal, discountAmount: originalTotal - total };
}

export const getProductSalePrice = (product: ProductModel) =>
  getDiscountedPrice(product.price, product.discountRate);

export const getNewProducts = (
  products: readonly ProductModel[],
  now: Date,
): ProductModel[] => {
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return products
    .filter(
      product =>
        product.createdAt >= thirtyDaysAgo && product.createdAt <= now,
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};
