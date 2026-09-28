import { FILTER_CONFIG } from '@/domains/product/product-filter.fixture';
import { products } from '@/domains/product';
import { getProductDiscount } from '@/domains/discount';

const getDiscountedPrice = (price: number, discount: number) =>
  discount > 0 ? Math.floor(price * (1 - discount / 100)) : price;

const getDiscountRate = (productId: number) => getProductDiscount(productId);

export async function getCategoryProducts(
  sortOption: string,
  filtersOption: string[],
  categorySlug: string,
  subcategorySlug: string,
) {
  const sizeOptions =
    FILTER_CONFIG.find(filter => filter.id === 'size')?.options ?? [];
  const priceOptions =
    FILTER_CONFIG.find(filter => filter.id === 'price')?.options ?? [];
  const discountOptions =
    FILTER_CONFIG.find(filter => filter.id === 'discount')?.options ?? [];
  const colorOptions =
    FILTER_CONFIG.find(filter => filter.id === 'color')?.options ?? [];

  const sizeIds = new Set(sizeOptions.map(option => String(option.id)));
  const priceIds = new Set(priceOptions.map(option => String(option.id)));
  const discountIds = new Set(discountOptions.map(option => String(option.id)));
  const colorIds = new Set(colorOptions.map(option => String(option.id)));

  const selectedSizeIds = filtersOption.filter(value => sizeIds.has(value));
  const selectedPriceId = filtersOption.find(value => priceIds.has(value));
  const selectedDiscountId = filtersOption.find(value =>
    discountIds.has(value),
  );
  const selectedColorIds = filtersOption.filter(value => colorIds.has(value));

  const filtered = products.filter(product => {
    if (subcategorySlug && subcategorySlug !== 'all') {
      if (
        product.category.parent !== categorySlug ||
        product.category.current !== subcategorySlug
      ) {
        return false;
      }
    } else if (product.category.parent !== categorySlug) {
      return false;
    }

    if (selectedSizeIds.length > 0) {
      const hasSize = product.variants.some(
        variant => selectedSizeIds.includes(variant.size) && variant.stock > 0,
      );
      if (!hasSize) return false;
    }

    if (selectedColorIds.length > 0) {
      const colorId = String(product.colorId);
      if (!selectedColorIds.includes(colorId)) return false;
    }

    if (selectedPriceId) {
      const price = getDiscountedPrice(product.price, getDiscountRate(product.id));
      if (selectedPriceId === '-50000' && price > 50000) return false;
      if (
        selectedPriceId === '50000-100000' &&
        (price < 50000 || price > 100000)
      ) {
        return false;
      }
      if (
        selectedPriceId === '100000-200000' &&
        (price < 100000 || price > 200000)
      ) {
        return false;
      }
      if (selectedPriceId === '+200000' && price < 200000) return false;
    }

    if (selectedDiscountId) {
      const threshold = Number(selectedDiscountId.replace('+', ''));
      if (Number.isFinite(threshold)) {
        if (getDiscountRate(product.id) < threshold) return false;
      }
    }

    return true;
  });

  const sorted = [...filtered];
  switch (sortOption) {
    case 'latest':
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case 'price_asc':
      sorted.sort(
        (a, b) =>
          getDiscountedPrice(a.price, getDiscountRate(a.id)) -
          getDiscountedPrice(b.price, getDiscountRate(b.id)),
      );
      break;
    case 'price_desc':
      sorted.sort(
        (a, b) =>
          getDiscountedPrice(b.price, getDiscountRate(b.id)) -
          getDiscountedPrice(a.price, getDiscountRate(a.id)),
      );
      break;
    case 'discount':
      sorted.sort((a, b) => getDiscountRate(b.id) - getDiscountRate(a.id));
      break;
    case 'popular':
      sorted.sort(
        (a, b) => b.productStats.totalSales - a.productStats.totalSales,
      );
      break;
    default:
      break;
  }

  return sorted;
}
