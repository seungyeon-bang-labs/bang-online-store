import { toProductCardViewModel } from '@/domains/product';
import { products, mainSliderGroupData } from '@/domains/product';
import { HomeProductSlider } from './home-product-slider';

export function MainProductSlider() {
  const productsById = new Map(products.map(product => [product.id, product]));

  return (
    <div className="flex flex-col gap-12 md:gap-20">
      {mainSliderGroupData.map(group => {
        const groupProducts = group.productIds
          .map(productId => productsById.get(productId))
          .filter(product => product !== undefined);

        if (groupProducts.length === 0) {
          return null;
        }

        return (
          <HomeProductSlider
            key={group.id}
            title={group.title}
            desktopRows={group.sliderOptions?.rows ?? 2}
            products={groupProducts.map(toProductCardViewModel)}
          />
        );
      })}
    </div>
  );
}
