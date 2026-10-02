import type { ProductVariantModel } from './model';

export type ProductColorViewModel = {
  id: number;
  label: string;
  hex: string;
};

export type ProductCardViewModel = {
  id: number;
  name: string;
  href: string;
  thumbnailUrl: string;
  price: number;
  discountRate: number;
  discountedPrice: number;
  isSoldOut: boolean;
};

export type ProductDetailViewModel = {
  id: number;
  name: string;
  price: number;
  discountRate: number;
  detailImages: string[];
  variants: readonly ProductVariantModel[];
  groupColors: ProductColorViewModel[];
};

export type ProductCartItemViewModel = {
  productId: number;
  styleId: number;
  variantId: string;
  name: string;
  color: string;
  thumbnailUrl: string;
  price: number;
  discountRate: number;
  stock: number;
  size: string;
  priceOffset: number;
};

export type ProductOptionViewModel = {
  productId: number;
  styleId: number;
  color: ProductColorViewModel;
  variants: readonly {
    id: string;
    size: string;
    stock: number;
    priceOffset: number;
  }[];
};
