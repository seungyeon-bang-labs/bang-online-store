import { products } from '@/lib/products-data';
import { toProductCardViewModel } from '@/domains/product';
import { ProductItem } from '@/features/product/product-item';
import { Slider } from '@/components/common/slider';
import { getProductDiscount } from '@/shared/lib/utils';

export function SaleProductsSlider() {
  const saleProducts = products.filter(product => getProductDiscount(product.id) > 0);

  return (
    <Slider title="할인 상품" href="/sale">
      {saleProducts.map(product => (
        <ProductItem
          key={product.id}
          product={toProductCardViewModel(product)}
        />
      ))}
    </Slider>
  );
}
