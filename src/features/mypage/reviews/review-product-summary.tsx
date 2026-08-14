import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardViewModel } from '@/domains/product';

interface ReviewProductSummaryProps {
  product: ProductCardViewModel;
  productName: string;
  optionLabel: string;
}

export function ReviewProductSummary({
  product,
  productName,
  optionLabel,
}: ReviewProductSummaryProps) {
  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 p-4 sm:grid-cols-[72px_minmax(0,1fr)] sm:gap-x-4 md:p-5">
      <Link
        href={product.href}
        className="relative aspect-square overflow-hidden rounded-sm bg-zinc-100"
      >
        <Image
          src={product.thumbnailUrl}
          alt={productName}
          fill
          sizes="(max-width: 640px) 64px, 72px"
          className="object-cover"
        />
      </Link>
      <div className="min-w-0 self-start">
        <Link
          href={product.href}
          className="block truncate font-black text-black hover:underline"
        >
          {productName}
        </Link>
        <p className="mt-0.5 text-sm font-medium text-zinc-500">
          {optionLabel}
        </p>
      </div>
    </div>
  );
}
