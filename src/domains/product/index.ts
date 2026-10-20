export { getNewProducts, getProductSalePrice } from './domain';
export { toSaleSectionViewModels } from './sale';
export {
  toProductCardViewModel,
  toProductCartItemViewModel,
  toProductColorViewModels,
  toProductDetailViewModel,
  toProductOptionViewModel,
} from './mapper';
export type {
  ProductModel,
  ProductSaleSectionModel,
  ProductStatsModel,
  ProductVariantModel,
} from './model';
import { createProductService } from './service';
import { productRepository } from './repository';
import { discountRepository } from '@/domains/discount/discount.repository';

export const productService = createProductService(productRepository, discountRepository);
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
  ProductSaleSectionViewModel,
} from './view-model';
