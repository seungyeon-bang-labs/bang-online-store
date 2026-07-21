import { Slider } from '@/components/common/slider';
import { toProductCardViewModel } from '@/domains/product';
import { ProductItem } from '@/features/product/product-item';
import { products } from '@/lib/products-data';
import { mainSliderGroupData } from '@/lib/main-slider-group-data';

export function MainProductSlider() {
  const productsById = new Map(products.map(product => [product.id, product]));

  return (
    <div className="flex flex-col gap-20">
      {mainSliderGroupData.map(group => {
        const groupProducts = group.productIds
          .map(productId => productsById.get(productId))
          .filter(product => product !== undefined);

        if (groupProducts.length === 0) {
          return null;
        }

        return (
          <Slider
            key={group.id}
            title={group.title}
            rows={group.sliderOptions?.rows ?? 2}
          >
            {groupProducts.map(product => (
              <ProductItem
                key={product.id}
                product={toProductCardViewModel(product)}
              />
            ))}
          </Slider>
        );
      })}
    </div>
  );
}
