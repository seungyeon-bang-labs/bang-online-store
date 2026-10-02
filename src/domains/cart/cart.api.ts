import type {
  ProductCartItemViewModel,
  ProductOptionViewModel,
} from '@/domains/product';

export type CartProductRequestItem = {
  productId: number;
  variantId: string;
};

export type CartProductResponse = {
  cartItems: readonly ProductCartItemViewModel[];
  optionGroups: Record<number, readonly ProductOptionViewModel[]>;
};
