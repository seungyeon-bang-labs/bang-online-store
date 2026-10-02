import {
  DISCOUNT_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  PRODUCT_SIZE_ORDER,
} from './config';
import {
  getProductDiscountRate,
  getProductSalePrice,
} from '../domain';
import type { ProductModel } from '../model';
import type {
  ProductFilterCriteria,
  ProductFilterOptionViewModel,
} from './view-model';

export function getAvailableSizeOptions(
  products: readonly ProductModel[],
): ProductFilterOptionViewModel[] {
  const availableSizes = new Set(
    products.flatMap(product =>
      product.variants
        .filter(variant => variant.stock > 0)
        .map(variant => variant.size),
    ),
  );

  return PRODUCT_SIZE_ORDER.filter(size => availableSizes.has(size)).map(
    size => ({ id: size, label: size }),
  );
}

export function getAvailableColorOptions(
  products: readonly ProductModel[],
): ProductFilterOptionViewModel[] {
  return [
    ...new Map(
      products.map(product => [
        product.color.id,
        {
          id: String(product.color.id),
          label: product.color.name,
          hex: product.color.hexCode,
        },
      ]),
    ).values(),
  ];
}

export function filterProducts(
  products: readonly ProductModel[],
  criteria: ProductFilterCriteria,
): ProductModel[] {
  const selectedPriceOption = PRICE_FILTER_OPTIONS.find(
    option => option.id === criteria.priceRangeId,
  );
  const selectedDiscountOption = DISCOUNT_FILTER_OPTIONS.find(
    option => option.id === criteria.discountRateId,
  );

  const filteredProducts = products.filter(product => {
    if (
      criteria.sizes.length > 0 &&
      !product.variants.some(
        variant =>
          criteria.sizes.includes(variant.size) && variant.stock > 0,
      )
    ) {
      return false;
    }

    if (
      criteria.colorIds.length > 0 &&
      !criteria.colorIds.includes(product.colorId)
    ) {
      return false;
    }

    const salePrice = getProductSalePrice(product);

    if (
      selectedPriceOption &&
      ((selectedPriceOption.minExclusive !== undefined &&
        salePrice <= selectedPriceOption.minExclusive) ||
        (selectedPriceOption.max !== undefined &&
          salePrice > selectedPriceOption.max))
    ) {
      return false;
    }

    if (
      selectedDiscountOption &&
      getProductDiscountRate(product.id) < selectedDiscountOption.minRate
    ) {
      return false;
    }

    return true;
  });

  return [...filteredProducts].sort((left, right) => {
    switch (criteria.sort) {
      case 'latest':
        return right.createdAt.getTime() - left.createdAt.getTime();
      case 'price_asc':
        return getProductSalePrice(left) - getProductSalePrice(right);
      case 'price_desc':
        return getProductSalePrice(right) - getProductSalePrice(left);
      case 'discount':
        return getProductDiscountRate(right.id) - getProductDiscountRate(left.id);
      case 'popular':
        return (right.stats?.totalSales ?? 0) - (left.stats?.totalSales ?? 0);
    }
  });
}
