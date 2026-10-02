import {
  DISCOUNT_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  PRODUCT_SORT_OPTIONS,
} from './config';
import type {
  ProductFilterCriteria,
  ProductFilterId,
  ProductFilterSelectionViewModel,
  ProductFilterViewModel,
  ProductSortOption,
} from './view-model';

type ProductFilterSearchParams = Record<
  string,
  string | string[] | undefined
>;

const DEFAULT_SORT: ProductSortOption = 'popular';

const isProductSortOption = (value: string): value is ProductSortOption =>
  PRODUCT_SORT_OPTIONS.some(option => option.value === value);

function getSearchParamValues(
  searchParams: ProductFilterSearchParams,
  key: string,
): string[] {
  const value = searchParams[key];
  const values = Array.isArray(value) ? value : value ? [value] : [];

  return values.flatMap(item => item.split(',')).filter(Boolean);
}

function getSectionOptionIds(
  filterViewModel: ProductFilterViewModel,
  filterId: ProductFilterId,
): Set<string> {
  return new Set(
    filterViewModel.sections
      .find(section => section.id === filterId)
      ?.options.map(option => option.id),
  );
}

function getFirstValidValue(values: readonly string[], validIds: Set<string>) {
  return values.find(value => validIds.has(value)) ?? null;
}

export function parseProductFilterCriteria(
  searchParams: ProductFilterSearchParams,
  filterViewModel: ProductFilterViewModel,
): ProductFilterCriteria {
  const sizeIds = getSectionOptionIds(filterViewModel, 'size');
  const colorIds = getSectionOptionIds(filterViewModel, 'color');
  const priceIds = new Set(PRICE_FILTER_OPTIONS.map(option => option.id));
  const discountIds = new Set(DISCOUNT_FILTER_OPTIONS.map(option => option.id));

  const sizes = getSearchParamValues(searchParams, 'size').filter(value =>
    sizeIds.has(value),
  );
  const colorIdsFromSearch = getSearchParamValues(searchParams, 'color')
    .filter(value => colorIds.has(value))
    .map(Number)
    .filter(Number.isSafeInteger);
  const sort = getSearchParamValues(searchParams, 'sort')[0];

  return {
    sizes: [...new Set(sizes)],
    colorIds: [...new Set(colorIdsFromSearch)],
    priceRangeId: getFirstValidValue(
      getSearchParamValues(searchParams, 'price'),
      priceIds,
    ),
    discountRateId: getFirstValidValue(
      getSearchParamValues(searchParams, 'discount'),
      discountIds,
    ),
    sort: sort && isProductSortOption(sort) ? sort : DEFAULT_SORT,
  };
}

export function toProductFilterSelectionViewModels(
  criteria: ProductFilterCriteria,
  filterViewModel: ProductFilterViewModel,
): ProductFilterSelectionViewModel[] {
  const labelByFilterValue = new Map<string, string>();

  filterViewModel.sections.forEach(section => {
    section.options.forEach(option => {
      labelByFilterValue.set(`${section.id}:${option.id}`, option.label);
    });
  });

  const selections: Pick<
    ProductFilterSelectionViewModel,
    'filterId' | 'value'
  >[] = [
    ...criteria.sizes.map(value => ({ filterId: 'size' as const, value })),
    ...criteria.colorIds.map(colorId => ({
      filterId: 'color' as const,
      value: String(colorId),
    })),
    ...(criteria.priceRangeId
      ? [{ filterId: 'price' as const, value: criteria.priceRangeId }]
      : []),
    ...(criteria.discountRateId
      ? [{ filterId: 'discount' as const, value: criteria.discountRateId }]
      : []),
  ];

  return selections.flatMap(selection => {
    const label = labelByFilterValue.get(
      `${selection.filterId}:${selection.value}`,
    );

    return label ? [{ ...selection, label }] : [];
  });
}
