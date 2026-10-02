import { getProductDiscount } from '@/domains/discount';
import type { ProductModel, ProductVariantModel } from './model';

export const isProductSoldOut = (variants: readonly ProductVariantModel[]) =>
  variants.every(variant => variant.stock <= 0);

export const getDiscountedPrice = (price: number, discountRate: number) =>
  discountRate > 0 ? Math.floor(price * (1 - discountRate / 100)) : price;

export const getProductDiscountRate = (productId: number) =>
  getProductDiscount(productId);

export const getProductSalePrice = (product: ProductModel) =>
  getDiscountedPrice(product.price, getProductDiscountRate(product.id));

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
