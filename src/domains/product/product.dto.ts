export type ProductOuterDTO = 'coat' | 'jacket' | 'cardigan' | 'padding';
export type ProductTopDTO = 't-shirt' | 'shirt' | 'knit' | 'blouse';
export type ProductBottomDTO = 'denim' | 'slacks' | 'skirt' | 'shorts';
export type ProductAccShoesDTO = 'bag' | 'shoes' | 'hat' | 'jewelry';

export type ProductCategoryDTO =
  | { parent: 'outer'; current: ProductOuterDTO }
  | { parent: 'top'; current: ProductTopDTO }
  | { parent: 'bottom'; current: ProductBottomDTO }
  | { parent: 'acc-shoes'; current: ProductAccShoesDTO };

export type ProductSizeOptionDTO =
  | 'XS'
  | 'S'
  | 'M'
  | 'L'
  | 'XL'
  | '2XL'
  | '3XL'
  | '4XL'
  | '5XL';

export type ProductVariantDTO = {
  id: string;
  size: ProductSizeOptionDTO;
  stock: number;
  price_offset: number;
};

export type ProductStateDTO = 'active' | 'inactive' | 'sold-out';

export type ProductStatsDTO = {
  totalSales: number;
  toDaySales: number;
  weeklySales: number;
  monthlySales: number;
};

export type ProductDTO = {
  id: number;
  group_id: number;
  name: string;
  colorId: number;
  category: ProductCategoryDTO;
  price: number;
  thumbnailImage: string;
  detailImages: string[];
  variants: ProductVariantDTO[];
  createdAt: Date;
  restockedAt?: Date;
  state: ProductStateDTO;
  productStats: ProductStatsDTO;
};

export type ProductColorDTO = {
  id: number;
  label: string;
  hexCode: string;
  code: string;
};

export type Product = ProductDTO;
export type Variant = ProductVariantDTO;
export type ProductStats = ProductStatsDTO;
export type ColorOption = ProductColorDTO;

