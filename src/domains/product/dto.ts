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

export type ProductStateDTO = 'active' | 'inactive';

export type ProductImageTypeDTO = 'thumbnail' | 'detail';

export type ProductDTO = {
  id: number;
  style_id: number;
  color_id: number;
  display_name: string | null;
  price: number;
  state: ProductStateDTO;
  created_at: string;
  restocked_at: string | null;
};

export type ProductStyleDTO = {
  id: number;
  name: string;
  category_id: string;
  created_at: string;
  updated_at: string;
};

export type ProductVariantDTO = {
  id: string;
  product_id: number;
  size: ProductSizeOptionDTO;
  stock: number;
  price_offset: number;
};

export type ProductStatsDTO = {
  product_id: number;
  total_sales: number;
  today_sales: number;
  weekly_sales: number;
  monthly_sales: number;
};

export type ProductImageDTO = {
  id: string;
  product_id: number;
  image_url: string;
  image_type: ProductImageTypeDTO;
  display_order: number;
};

export type ProductColorDTO = {
  id: number;
  name: string;
  hex_code: string;
  code: string;
};
