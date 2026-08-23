import Image from 'next/image';
import Link from 'next/link';
import type {
  OrderClaimDetailReturnProductViewModel,
  OrderClaimProductViewModel,
} from '@/domains/order/claim/view-model';
import { MypageClaimDetailCollapsibleCard } from './collapsible-card';

interface MypageClaimDetailProductProps {
  product: OrderClaimDetailReturnProductViewModel;
}

export function MypageClaimDetailProduct({
  product,
}: MypageClaimDetailProductProps) {
  return (
    <MypageClaimDetailCollapsibleCard title={product.title}>
      <MypageClaimDetailProductContent
        item={product.item}
        className="p-4 md:p-5"
      />
    </MypageClaimDetailCollapsibleCard>
  );
}

interface MypageClaimDetailProductContentProps {
  item: OrderClaimProductViewModel;
  className?: string;
  isMuted?: boolean;
}

export function MypageClaimDetailProductContent({
  item,
  className,
  isMuted = false,
}: MypageClaimDetailProductContentProps) {
  const textColorClassName = isMuted ? 'text-zinc-500' : 'text-black';

  return (
    <div
      className={`grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[88px_minmax(0,1fr)] ${
        className ?? ''
      }`}
    >
      <Link
        href={item.product.href}
        className="relative row-span-3 aspect-square overflow-hidden rounded-sm bg-zinc-100 focus-visible:outline-offset-2 focus-visible:outline-black"
      >
        <Image
          src={item.product.thumbnailUrl}
          alt={item.productName}
          fill
          sizes="(max-width: 640px) 72px, 88px"
          className="object-cover transition-opacity hover:opacity-80"
        />
      </Link>
      <Link
        href={item.product.href}
        className={`min-w-0 font-black hover:underline focus-visible:outline-offset-2 focus-visible:outline-black ${textColorClassName}`}
      >
        {item.productName}
      </Link>
      <p className="mt-0.5 text-sm font-medium text-zinc-500">
        {item.optionLabel} · {item.quantity}개
      </p>
      <p className={`mt-1 font-black ${textColorClassName}`}>
        {item.lineTotalText}
      </p>
    </div>
  );
}
