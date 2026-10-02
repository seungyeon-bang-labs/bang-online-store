import type {
  ProductColorDTO,
  ProductDTO,
  ProductImageDTO,
  ProductStatsDTO,
  ProductStyleDTO,
  ProductVariantDTO,
} from './dto';
import type {
  ProductColorModel,
  ProductImageModel,
  ProductModel,
  ProductStatsModel,
  ProductStyleModel,
  ProductVariantModel,
} from './model';
import { getProductDiscountRate, getProductSalePrice, isProductSoldOut } from './domain';
import type {
  ProductCardViewModel,
  ProductCartItemViewModel,
  ProductColorViewModel,
  ProductDetailViewModel,
  ProductOptionViewModel,
} from './view-model';

export function toProductModel({
  product,
  style,
  color,
  variants,
  stats,
  images,
}: {
  product: ProductDTO;
  style: ProductStyleDTO;
  color: ProductColorDTO;
  variants: readonly ProductVariantDTO[];
  stats: ProductStatsDTO | null;
  images: readonly ProductImageDTO[];
}): ProductModel {
  const styleModel: ProductStyleModel = {
    id: style.id,
    name: style.name,
    categoryId: style.category_id,
    createdAt: new Date(style.created_at),
    updatedAt: new Date(style.updated_at),
  };
  const colorModel: ProductColorModel = { id: color.id, name: color.name, hexCode: color.hex_code, code: color.code };
  const variantModels: ProductVariantModel[] = variants.map(variant => ({ id: variant.id, productId: variant.product_id, size: variant.size, stock: variant.stock, priceOffset: variant.price_offset }));
  const imageModels: ProductImageModel[] = [...images]
    .sort((a, b) => a.display_order - b.display_order)
    .map(image => ({ id: image.id, url: image.image_url, type: image.image_type, displayOrder: image.display_order }));
  const statsModel: ProductStatsModel | null = stats && { totalSales: stats.total_sales, todaySales: stats.today_sales, weeklySales: stats.weekly_sales, monthlySales: stats.monthly_sales };

  return {
    id: product.id,
    styleId: product.style_id,
    colorId: product.color_id,
    name: product.display_name ?? `${color.name} ${style.name}`,
    categoryId: style.category_id,
    price: product.price,
    state: product.state,
    createdAt: new Date(product.created_at),
    restockedAt: product.restocked_at ? new Date(product.restocked_at) : null,
    variants: variantModels,
    stats: statsModel,
    images: imageModels,
    color: colorModel,
    style: styleModel,
  };
}

export const toProductCardViewModel = (product: ProductModel): ProductCardViewModel => ({
  id: product.id,
  name: product.name,
  href: `/product/${product.id}`,
  thumbnailUrl: product.images.find(image => image.type === 'thumbnail')?.url
    ? `/images/${product.images.find(image => image.type === 'thumbnail')?.url}`
    : product.images[0]?.url
      ? `/images/${product.images[0].url}`
      : '/file.svg',
  price: product.price,
  discountRate: getProductDiscountRate(product.id),
  discountedPrice: getProductSalePrice(product),
  isSoldOut: isProductSoldOut(product.variants),
});

export const toProductColorViewModels = (products: readonly ProductModel[]): ProductColorViewModel[] =>
  products.map(product => ({ id: product.id, label: product.color.name, hex: product.color.hexCode }));

export const toProductDetailViewModel = (product: ProductModel, styleProducts: readonly ProductModel[]): ProductDetailViewModel => ({
  id: product.id,
  name: product.name,
  price: product.price,
  discountRate: getProductDiscountRate(product.id),
  detailImages:
    product.images.length > 0
      ? product.images.map(image => image.url)
      : ['/file.svg'],
  variants: product.variants,
  groupColors: toProductColorViewModels(styleProducts),
});

export function toProductCartItemViewModel(
  product: ProductModel,
  variantId: string,
): ProductCartItemViewModel | null {
  const variant = product.variants.find(item => item.id === variantId);
  if (!variant) return null;

  return {
    productId: product.id,
    styleId: product.styleId,
    variantId: variant.id,
    name: product.name,
    color: product.color.name,
    thumbnailUrl: toProductCardViewModel(product).thumbnailUrl,
    price: product.price,
    discountRate: getProductDiscountRate(product.id),
    stock: variant.stock,
    size: variant.size,
    priceOffset: variant.priceOffset,
  };
}

export const toProductOptionViewModel = (
  product: ProductModel,
): ProductOptionViewModel => ({
  productId: product.id,
  styleId: product.styleId,
  color: {
    id: product.color.id,
    label: product.color.name,
    hex: product.color.hexCode,
  },
  variants: product.variants.map(variant => ({
    id: variant.id,
    size: variant.size,
    stock: variant.stock,
    priceOffset: variant.priceOffset,
  })),
});
