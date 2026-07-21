import type { Product } from './product.dto';
import {
  getProductDiscountRate,
  getProductSalePrice,
  getSelectableVariants,
  isProductSoldOut,
} from './product.domain';
import {
  toProductCardViewModel,
  toProductDetailViewModel,
} from './product.presenter';

export class ProductDO {
  private constructor(private readonly product: Product) {}

  static fromDTO(product: Product) {
    return new ProductDO(product);
  }

  isSoldOut() {
    return isProductSoldOut(this.product.variants);
  }

  getDiscountRate() {
    return getProductDiscountRate(this.product.id);
  }

  getSalePrice() {
    return getProductSalePrice(this.product);
  }

  getSelectableVariants() {
    return getSelectableVariants(this.product.variants);
  }

  toCardViewModel() {
    return toProductCardViewModel(this.product);
  }

  toDetailViewModel() {
    return toProductDetailViewModel(this.product);
  }
}

