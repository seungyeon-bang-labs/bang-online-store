import Link from 'next/link';
import type { ActivityProductViewModel } from '@/domains/activity';
import { MypageProductThumbnailLink } from '@/features/mypage/common/product-summary';
import { ProductPrice } from '@/features/product/product-price';
import { MypageRecentProductRemoveButton } from './remove-button';

interface MypageRecentProductItemProps {
  item: ActivityProductViewModel;
}

export function MypageRecentProductItem({
  item,
}: MypageRecentProductItemProps) {
  const { product } = item;

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 px-3 py-4 sm:grid-cols-[88px_minmax(0,1fr)] md:px-4 md:py-5">
      <MypageProductThumbnailLink
        href={product.href}
        src={product.thumbnailUrl}
        alt={product.name}
      />

      <div className="min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2">
          <Link
            href={product.href}
            className="block min-w-0 truncate text-sm leading-5 font-black text-black outline-none hover:underline focus-visible:underline sm:text-base sm:leading-tight"
          >
            {product.name}
          </Link>
          <MypageRecentProductRemoveButton productName={product.name} />
        </div>
        <ProductPrice
          price={product.price}
          discount={product.discountRate}
          size="compact"
          className="mt-1"
        />
      </div>
    </article>
  );
}
