import { ProductPrice } from '@/features/product/product-price';

type ProductInfoProps = {
  name: string;
  price: number;
  discount: number;
};

export function ProductInfo({
  name,
  price,
  discount,
}: ProductInfoProps) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg md:text-xl lg:text-2xl font-black tracking-tighter leading-tight text-gray-900">
        {name}
      </h1>

      <ProductPrice price={price} discount={discount} size="lg" />
    </div>
  );
}
