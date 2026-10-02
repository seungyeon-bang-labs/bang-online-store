import type { ProductCardViewModel } from '@/domains/product';
import { Slider } from '@/shared/components/common/slider';
import { ProductItem } from './product-item';

interface HomeProductSliderProps {
  products: readonly ProductCardViewModel[];
  title: string;
  href?: string;
  desktopRows?: number;
}

export function HomeProductSlider({
  products,
  title,
  href,
  desktopRows = 2,
}: HomeProductSliderProps) {
  return (
    <>
      <div className="md:hidden">
        <Slider
          title={title}
          href={href}
          rows={1}
          contentClassName="-ml-2"
          itemClassName="basis-[45%] pl-2"
          slidesToScroll="auto"
          showButtons={false}
        >
          {products.map(product => (
            <ProductItem key={product.id} product={product} />
          ))}
        </Slider>
      </div>
      <div className="hidden md:block">
        <Slider title={title} href={href} rows={desktopRows}>
          {products.map(product => (
            <ProductItem key={product.id} product={product} />
          ))}
        </Slider>
      </div>
    </>
  );
}
