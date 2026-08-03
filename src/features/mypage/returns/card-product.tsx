import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardViewModel } from '@/domains/product';

interface MypageClaimCardProductProps {
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
  lineTotalText: string;
}

export function MypageClaimCardProduct({
  product,
  productName,
  optionLabel,
  lineTotalText,
}: MypageClaimCardProductProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] grid-rows-[auto_auto_auto] gap-x-4 p-4 sm:grid-cols-[88px_minmax(0,1fr)] md:p-5">
      <Link
        href={product.href}
        className="relative row-span-3 aspect-square overflow-hidden rounded-sm bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <Image
          src={product.thumbnailUrl}
          alt={productName}
          fill
          sizes="(max-width: 640px) 72px, 88px"
          className="object-cover transition-opacity hover:opacity-80"
        />
      </Link>
      <Link
        href={product.href}
        className="col-start-2 row-start-1 min-w-0 font-black text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        {productName}
      </Link>
      <p className="col-start-2 row-start-2 mt-0.5 text-sm font-medium text-zinc-500">
        {optionLabel}
      </p>
      <p className="col-start-2 row-start-3 mt-1 justify-self-end font-black text-black">
        {lineTotalText}
      </p>
    </div>
  );
}
