import type {
  ProductFilterControlType,
  ProductFilterId,
  ProductSortOption,
} from './view-model';

type PriceFilterOption = {
  id: string;
  label: string;
  minExclusive?: number;
  max?: number;
};

type DiscountFilterOption = {
  id: string;
  label: string;
  minRate: number;
};

export const PRODUCT_FILTER_LAYOUT: readonly {
  id: ProductFilterId;
  label: string;
  type: ProductFilterControlType;
  isMultiple: boolean;
}[] = [
  { id: 'size', label: '사이즈', type: 'button', isMultiple: true },
  { id: 'price', label: '가격대', type: 'checkbox', isMultiple: false },
  { id: 'discount', label: '할인율', type: 'button', isMultiple: false },
  { id: 'color', label: '색상', type: 'color', isMultiple: true },
];

export const PRICE_FILTER_OPTIONS: readonly PriceFilterOption[] = [
  { id: 'under-50000', label: '5만원 이하', max: 50_000 },
  {
    id: '50000-100000',
    label: '5만원 - 10만원',
    minExclusive: 50_000,
    max: 100_000,
  },
  {
    id: '100000-200000',
    label: '10만원 - 20만원',
    minExclusive: 100_000,
    max: 200_000,
  },
  { id: 'over-200000', label: '20만원 이상', minExclusive: 200_000 },
] as const;

export const DISCOUNT_FILTER_OPTIONS: readonly DiscountFilterOption[] = [
  { id: 'over-30', label: '30% 이상', minRate: 30 },
  { id: 'over-50', label: '50% 이상', minRate: 50 },
  { id: 'over-70', label: '70% 이상', minRate: 70 },
] as const;

export const PRODUCT_SORT_OPTIONS: readonly {
  label: string;
  value: ProductSortOption;
}[] = [
  { label: '인기순', value: 'popular' },
  { label: '신상품순', value: 'latest' },
  { label: '낮은 가격순', value: 'price_asc' },
  { label: '높은 가격순', value: 'price_desc' },
  { label: '할인율순', value: 'discount' },
];

export const PRODUCT_SIZE_ORDER = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
] as const;
