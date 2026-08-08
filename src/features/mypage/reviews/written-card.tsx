import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { WrittenReviewViewModel } from '@/domains/activity';
import { ReviewProductThumbnail } from './product-thumbnail';

interface WrittenReviewCardProps {
  review: WrittenReviewViewModel;
}

export function WrittenReviewCard({ review }: WrittenReviewCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <div className="grid grid-cols-[80px_minmax(0,1fr)] grid-rows-[auto_auto_auto_auto_auto_auto] gap-x-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)] md:p-5">
        <ReviewProductThumbnail product={review.product} alt={review.product.name} />
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={review.product.href}
            className="min-w-0 flex-1 truncate font-black text-black hover:underline"
          >
            {review.product.name}
          </Link>
          <button
            type="button"
            aria-label={`${review.product.name} 리뷰 삭제`}
            className="inline-flex size-6 items-center justify-center rounded-sm text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:size-7"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-0.5 text-sm font-medium text-zinc-500">
          {review.optionLabel}
        </p>
        <p
          aria-label={'별점 ' + review.rating + '점'}
          className="mt-1 text-base leading-none tracking-widest text-amber-400"
        >
          {'★'.repeat(review.rating)}
        </p>
        <p className="mt-0.5 text-xs font-bold text-zinc-400">
          작성일 {review.createdAt}
        </p>
        <p className="col-span-2 mt-3 line-clamp-3 rounded-sm bg-zinc-100 px-4 py-3 text-sm font-medium leading-relaxed text-zinc-700">
          {review.content}
        </p>
        <div className="col-span-2 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
          >
            수정
          </Button>
        </div>
      </div>
    </article>
  );
}
