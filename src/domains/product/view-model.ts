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

export type ProductSaleSectionViewModel = {
  id: number;
  title: string;
  remainingLabel: string;
  productCardViewModels: readonly ProductCardViewModel[];
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
  variantId: number;
  name: string;
  color: string;
  thumbnailUrl: string;
  price: number;
  discountRate: number;
  stock: number;
  size: string;
  priceOffset: number;
  /** Set only on a line whose product is no longer sold; such a line is shown so the customer can delete it. */
  discontinued?: true;
};

export type ProductOptionViewModel = {
  productId: number;
  styleId: number;
  name: string;
  thumbnailUrl: string;
  price: number;
  discountRate: number;
  color: ProductColorViewModel;
  variants: readonly {
    id: number;
    size: string;
    stock: number;
    priceOffset: number;
  }[];
};
