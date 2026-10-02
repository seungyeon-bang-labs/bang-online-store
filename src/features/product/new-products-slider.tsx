import { toProductCardViewModel } from '@/domains/product';
import { products } from '@/domains/product';
import { HomeProductSlider } from './home-product-slider';

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

  if (newProducts.length === 0) {
    return null
  }

  return (
    <HomeProductSlider
      title="신규 상품"
      href="/new"
      desktopRows={1}
      products={newProducts.map(toProductCardViewModel)}
    />
  );
}
