export type ProductSectionDTO = {
  id: number;
  title: string;
  display_order: number;
  desktop_rows: number;
  is_active: boolean;
};

/** Supabase 전환 시 (section_id, product_id) 복합 unique 제약을 둔다. */
export type ProductSectionItemDTO = {
  section_id: number;
  product_id: number;
  display_order: number;
};
