import { getProductDiscount } from '@/domains/discount';
import type { Product, Variant } from './product.dto';

export const isProductSoldOut = (variants: Variant[]) =>
  variants.every(variant => variant.stock <= 0);

export const getDiscountedPrice = (price: number, discountRate: number) =>
  discountRate > 0 ? Math.floor(price * (1 - discountRate / 100)) : price;

export const getProductDiscountRate = (productId: number) =>
  getProductDiscount(productId);

export const getProductSalePrice = (product: Product) =>
  getDiscountedPrice(product.price, getProductDiscountRate(product.id));

export const getSelectableVariants = (variants: Variant[]) =>
  variants.filter(variant => variant.stock > 0);

