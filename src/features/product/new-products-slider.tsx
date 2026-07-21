import { toProductCardViewModel } from '@/domains/product';
import { ProductItem } from '@/features/product/product-item';
import { Slider } from '@/components/common/slider';
import { products } from '@/lib/products-data';

export function NewProductsSlider() {
  const newProducts = products
    .filter(product => {
      const diffInDays =
        (new Date().getTime() - new Date(product.createdAt).getTime()) /
        (1000 * 3600 * 24);
      return diffInDays <= 30;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  return (
    <Slider rows={1} title="신규 상품" href="/new">
      {newProducts.map(product => (
        <ProductItem
          key={product.id}
          product={toProductCardViewModel(product)}
        />
      ))}
    </Slider>
  );
}
