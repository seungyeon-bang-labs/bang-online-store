import type { ProductSectionDTO, ProductSectionItemDTO } from './dto';

export const PRODUCT_SECTION_FIXTURE: readonly ProductSectionDTO[] = [
  {
    id: 1,
    title: '가을 인기 상품',
    display_order: 1,
    desktop_rows: 2,
    is_active: true,
  },
  {
    id: 2,
    title: '이달의 추천 상품',
    display_order: 2,
    desktop_rows: 1,
    is_active: true,
  },
];

export const PRODUCT_SECTION_ITEM_FIXTURE: readonly ProductSectionItemDTO[] = [
  { section_id: 1, product_id: 1, display_order: 1 },
  { section_id: 1, product_id: 2, display_order: 2 },
  { section_id: 1, product_id: 3, display_order: 3 },
  { section_id: 1, product_id: 4, display_order: 4 },
  { section_id: 1, product_id: 5, display_order: 5 },
  { section_id: 1, product_id: 6, display_order: 6 },
  { section_id: 1, product_id: 7, display_order: 7 },
  { section_id: 1, product_id: 8, display_order: 8 },
  { section_id: 1, product_id: 9, display_order: 9 },
  { section_id: 1, product_id: 10, display_order: 10 },
  { section_id: 1, product_id: 11, display_order: 11 },
  { section_id: 1, product_id: 12, display_order: 12 },
  { section_id: 1, product_id: 13, display_order: 13 },
  { section_id: 1, product_id: 14, display_order: 14 },
  { section_id: 1, product_id: 15, display_order: 15 },
  { section_id: 2, product_id: 16, display_order: 1 },
  { section_id: 2, product_id: 17, display_order: 2 },
  { section_id: 2, product_id: 18, display_order: 3 },
  { section_id: 2, product_id: 19, display_order: 4 },
  { section_id: 2, product_id: 20, display_order: 5 },
  { section_id: 2, product_id: 21, display_order: 6 },
  { section_id: 2, product_id: 22, display_order: 7 },
  { section_id: 2, product_id: 23, display_order: 8 },
  { section_id: 2, product_id: 24, display_order: 9 },
  { section_id: 2, product_id: 25, display_order: 10 },
];
