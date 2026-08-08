import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { InquiryContextViewModel } from '@/domains/inquiry';

interface MypageInquiryContextProps {
  context: InquiryContextViewModel;
}

export function MypageInquiryContext({
  context,
}: MypageInquiryContextProps) {
  return (
    <section className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-x-4">
      <Link
        href={context.product.href}
        className={`relative aspect-square overflow-hidden rounded-sm bg-zinc-100 ${
          context.kind === 'order' ? 'row-span-3' : 'row-span-2'
        }`}
      >
        <Image
          src={context.product.thumbnailUrl}
          alt={context.product.name}
          fill
          sizes="(max-width: 640px) 72px, 88px"
          className="object-cover"
        />
      </Link>
      <div className="flex min-w-0 items-center gap-2">
        {context.kind === 'product' ? (
          <Link
            href={context.product.href}
            className="min-w-0 flex-1 truncate text-sm font-black text-black hover:underline"
          >
            {context.product.name}
          </Link>
        ) : (
          <p className="min-w-0 flex-1 truncate text-sm font-black text-black">
            {context.product.name}
            {context.productCount > 1
              ? ` 외 ${context.productCount - 1}개`
              : ''}
          </p>
        )}
      </div>
      {context.kind === 'product' ? (
        context.optionLabel ? (
          <p className="mt-0.5 text-sm font-medium text-zinc-500">
            {context.optionLabel}
          </p>
        ) : null
      ) : context.representativeOptionLabel ? (
        <p className="mt-0.5 text-sm font-medium text-zinc-500">
          {context.productCount > 1 ? '대표 상품 옵션 ' : ''}
          {context.representativeOptionLabel}
        </p>
      ) : null}
      {context.kind === 'order' ? (
        <button
          type="button"
          disabled
          className="mt-1 inline-flex w-fit items-center gap-0.5 text-xs font-bold text-black disabled:cursor-not-allowed"
        >
          주문 상세 보기
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </section>
  );
}
