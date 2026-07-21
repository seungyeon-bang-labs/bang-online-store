export interface ProductFilterColorOptionDTO {
  id: number;
  label: string;
  colorCode: string;
}

export interface ProductFilterOptionDTO {
  id: string;
  label: string;
}

export type ProductFilterIdDTO = 'size' | 'price' | 'discount' | 'color';

export interface ProductFilterSectionDTO {
  id: ProductFilterIdDTO;
  label: string;
  type: 'button' | 'checkbox' | 'color';
  isMultiple: boolean;
  options: ProductFilterOptionDTO[] | ProductFilterColorOptionDTO[];
}

export type ColorOption = ProductFilterColorOptionDTO;
export type FilterOption = ProductFilterOptionDTO;
export type FilterId = ProductFilterIdDTO;
export type FilterSection = ProductFilterSectionDTO;

