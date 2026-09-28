import { products } from '@/domains/product';
import { toProductCardViewModel } from '@/domains/product';
import { getProductDiscount } from '@/domains/discount';
import { HomeProductSlider } from './home-product-slider';

export function SaleProductsSlider() {
  const saleProducts = products.filter(product => getProductDiscount(product.id) > 0);

  return (
    <HomeProductSlider
      title="할인 상품"
      href="/sale"
      products={saleProducts.map(toProductCardViewModel)}
    />
  );
}
