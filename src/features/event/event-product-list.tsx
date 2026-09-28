import type { EventProductSectionViewModel } from '@/domains/event';
import { ProductItem } from '@/features/product/product-item';

interface EventProductListProps {
  productSection: EventProductSectionViewModel;
  showCurrentProductNotice?: boolean;
}

export function EventProductList({
  productSection,
  showCurrentProductNotice = false,
}: EventProductListProps) {
  if (!productSection.products.length) return null;

  return (
    <section className="mt-8 rounded-sm bg-white shadow-sm md:mt-10">
      {productSection.title && (
        <div className="rounded-t-sm border-b border-gray-200 p-5 text-center md:p-8">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-black uppercase">
            {productSection.title}
          </h2>
        </div>
      )}

      {showCurrentProductNotice && (
        <div className="bg-zinc-100 px-4 py-4 text-zinc-900 md:px-5">
          <p className="mt-1 text-sm font-medium text-center leading-relaxed text-zinc-600">
            현재 판매 정보 기준으로 표시되며, 이벤트 당시 혜택은 종료되었습니다.
          </p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 md:p-10 lg:grid-cols-5">
        {productSection.products.map(productCardViewModel => (
          <ProductItem
            key={productCardViewModel.id}
            product={productCardViewModel}
          />
        ))}
      </div>
    </section>
  );
}
