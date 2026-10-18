export { getNewProducts, getProductDiscountRate, getProductSalePrice } from './domain';
export {
  toProductCardViewModel,
  toProductCartItemViewModel,
  toProductColorViewModels,
  toProductDetailViewModel,
  toProductOptionViewModel,
} from './mapper';
export type {
  ProductModel,
  ProductStatsModel,
  ProductVariantModel,
} from './model';
import { createProductService } from './service';
import { productRepository } from './repository';

export const productService = createProductService(productRepository);
export {
  filterProducts,
  parseProductFilterCriteria,
  PRODUCT_SORT_OPTIONS,
  toProductFilterSelectionViewModels,
  toProductFilterViewModel,
} from './filter';
export type {
  ProductFilterCriteria,
  ProductFilterId,
  ProductFilterSelectionViewModel,
  ProductFilterViewModel,
  ProductSortOption,
} from './filter';
export {
  createProductSections,
  productSectionRepository,
  toProductSectionViewModels,
} from './section';
export type {
  ProductCardViewModel,
  ProductCartItemViewModel,
  ProductOptionViewModel,
} from './view-model';
