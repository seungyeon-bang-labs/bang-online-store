export type ProductFilterId = 'size' | 'price' | 'discount' | 'color';

export type ProductFilterControlType = 'button' | 'checkbox' | 'color';

export type ProductSortOption =
  | 'popular'
  | 'latest'
  | 'price_asc'
  | 'price_desc'
  | 'discount';

export type ProductFilterOptionViewModel = {
  id: string;
  label: string;
  hex?: string;
};

export type ProductFilterSectionViewModel = {
  id: ProductFilterId;
  label: string;
  type: ProductFilterControlType;
  isMultiple: boolean;
  options: readonly ProductFilterOptionViewModel[];
};

export type ProductFilterViewModel = {
  sections: readonly ProductFilterSectionViewModel[];
};

export type ProductFilterCriteria = {
  sizes: readonly string[];
  colorIds: readonly number[];
  priceRangeId: string | null;
  discountRateId: string | null;
  sort: ProductSortOption;
};

export type ProductFilterSelectionViewModel = {
  filterId: ProductFilterId;
  value: string;
  label: string;
};
