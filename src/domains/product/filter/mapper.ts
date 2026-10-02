import {
  DISCOUNT_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  PRODUCT_FILTER_LAYOUT,
} from './config';
import {
  getAvailableColorOptions,
  getAvailableSizeOptions,
} from './domain';
import type { ProductModel } from '../model';
import type {
  ProductFilterOptionViewModel,
  ProductFilterViewModel,
} from './view-model';

export function toProductFilterViewModel(
  products: readonly ProductModel[],
): ProductFilterViewModel {
  const optionsByFilterId = new Map<string, readonly ProductFilterOptionViewModel[]>([
    ['size', getAvailableSizeOptions(products)],
    ['price', PRICE_FILTER_OPTIONS.map(option => ({ id: option.id, label: option.label }))],
    [
      'discount',
      DISCOUNT_FILTER_OPTIONS.map(option => ({
        id: option.id,
        label: option.label,
      })),
    ],
    ['color', getAvailableColorOptions(products)],
  ]);

  return {
    sections: PRODUCT_FILTER_LAYOUT.map(section => ({
      ...section,
      options: optionsByFilterId.get(section.id) ?? [],
    })),
  };
}
