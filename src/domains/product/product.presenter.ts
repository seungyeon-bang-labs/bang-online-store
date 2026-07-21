import { colorMap, products } from './product.fixture';
import type { Product } from './product.dto';
import {
  getProductDiscountRate,
  getProductSalePrice,
  isProductSoldOut,
} from './product.domain';
import type {
  ProductCardViewModel,
  ProductDetailViewModel,
} from './product.view-model';

export const toProductCardViewModel = (
  product: Product,
): ProductCardViewModel => {
  const discountRate = getProductDiscountRate(product.id);

  return {
    id: product.id,
    name: product.name,
    href: `/product/${product.id}`,
    thumbnailUrl: `/images/${product.thumbnailImage}`,
    price: product.price,
    discountRate,
    discountedPrice: getProductSalePrice(product),
    isSoldOut: isProductSoldOut(product.variants),
  };
};

export const getGroupProductColors = (product: Product) => {
  if (!product.group_id) {
    const colorInfo = colorMap.find(color => color.id === product.colorId);

    return [
      {
        id: product.id,
        label: colorInfo?.label ?? '기본',
        hex: colorInfo?.hexCode ?? '#000000',
      },
    ];
  }

  return products
    .filter(item => item.group_id === product.group_id)
    .map(item => {
      const colorInfo = colorMap.find(color => color.id === item.colorId);

      return {
        id: item.id,
        label: colorInfo?.label ?? '기본',
        hex: colorInfo?.hexCode ?? '#000000',
      };
    });
};

export const toProductDetailViewModel = (
  product: Product,
): ProductDetailViewModel => ({
  id: product.id,
  name: product.name,
  price: product.price,
  discountRate: getProductDiscountRate(product.id),
  detailImages: product.detailImages,
  variants: product.variants,
  groupColors: getGroupProductColors(product),
});

