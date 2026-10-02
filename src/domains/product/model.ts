import type { ProductSizeOptionDTO, ProductStateDTO } from './dto';

export type ProductVariantModel = {
  id: string;
  productId: number;
  size: ProductSizeOptionDTO;
  stock: number;
  priceOffset: number;
};

export type ProductStatsModel = {
  totalSales: number;
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
};

export type ProductImageModel = {
  id: string;
  url: string;
  type: 'thumbnail' | 'detail';
  displayOrder: number;
};

export type ProductColorModel = {
  id: number;
  name: string;
  hexCode: string;
  code: string;
};

export type ProductStyleModel = {
  id: number;
  name: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductModel = {
  id: number;
  styleId: number;
  colorId: number;
  name: string;
  categoryId: string;
  price: number;
  state: ProductStateDTO;
  createdAt: Date;
  restockedAt: Date | null;
  variants: readonly ProductVariantModel[];
  stats: ProductStatsModel | null;
  images: readonly ProductImageModel[];
  color: ProductColorModel;
  style: ProductStyleModel;
};
