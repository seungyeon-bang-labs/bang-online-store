import type { Variant } from './product.dto';

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
  variants: Variant[];
  groupColors: ProductColorViewModel[];
};

