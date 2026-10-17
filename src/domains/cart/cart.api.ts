import type {
  ProductCartItemViewModel,
  ProductOptionViewModel,
} from '@/domains/product';

export type CartProductRequestItem = {
  productId: number;
  variantId: number;
};

export type CartProductResponse = {
  cartItems: readonly ProductCartItemViewModel[];
  optionGroups: Record<number, readonly ProductOptionViewModel[]>;
};
