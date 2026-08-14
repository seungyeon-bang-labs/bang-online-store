import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { AvailableReviewViewModel } from '@/domains/activity/view-model';
import { ReviewProductThumbnail } from './product-thumbnail';

interface AvailableReviewCardProps {
  review: AvailableReviewViewModel;
}

export function AvailableReviewCard({ review }: AvailableReviewCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <div className="grid grid-cols-[80px_minmax(0,1fr)] grid-rows-[auto_auto_auto_auto_auto] gap-x-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)] md:p-5">
        <ReviewProductThumbnail
          product={review.product}
          alt={review.productName}
        />
        <Link
          href={review.product.href}
          className="truncate font-black text-black hover:underline"
        >
          {review.productName}
        </Link>
        <p className="mt-0.5 text-sm font-medium text-zinc-500">
          {review.optionLabel}
        </p>
        <p className="mt-2 text-sm font-medium text-zinc-400">
          주문일 {review.orderedAt}
        </p>
        <p className="mt-0.5 text-sm font-bold text-zinc-700">
          작성기한 {review.reviewDeadlineAt}{' '}
          <span className="font-black text-black">
            ({review.reviewDeadlineDday})
          </span>
        </p>
        <div className="col-span-2 mt-3">
          <Button
            asChild
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
          >
            <Link href={`/mypage/reviews/write/${review.orderItemId}`}>
              리뷰 작성
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
