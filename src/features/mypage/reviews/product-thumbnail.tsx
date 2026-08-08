import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardViewModel } from '@/domains/product';

interface ReviewProductThumbnailProps {
  product: ProductCardViewModel;
  alt: string;
}

export function ReviewProductThumbnail({
  product,
  alt,
}: ReviewProductThumbnailProps) {
  return (
    <Link
      href={product.href}
      className="relative row-span-4 aspect-square self-start overflow-hidden rounded-sm bg-zinc-100"
    >
      <Image
        src={product.thumbnailUrl}
        alt={alt}
        fill
        sizes="(max-width: 640px) 80px, 96px"
        className="object-cover"
      />
    </Link>
  );
}
