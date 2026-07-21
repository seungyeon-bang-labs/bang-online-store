import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ReviewItemViewModel } from '@/domains/activity';

export function MypageReviewList({
  reviews,
}: {
  reviews: ReviewItemViewModel[];
}) {
  return (
    <div className="space-y-4">
      {reviews.map(review =>
        review.kind === 'available' ? (
          <article
            key={review.orderItemId}
            className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 rounded-md border border-zinc-300 bg-white p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center md:p-5"
          >
            <Link
              href={review.product.href}
              className="relative aspect-square overflow-hidden rounded-sm bg-zinc-100"
            >
              <Image
                src={review.product.thumbnailUrl}
                alt={review.productName}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-400">
                {review.orderNumber}
              </p>
              <Link
                href={review.product.href}
                className="mt-2 block font-black text-black hover:underline"
              >
                {review.productName}
              </Link>
              <p className="mt-1 text-sm font-medium text-zinc-500">
                {review.optionLabel}
              </p>
              <p className="mt-3 text-xs font-bold text-zinc-400">
                주문일 {review.orderedAt}
              </p>
            </div>
            <Button
              type="button"
              className="col-start-2 sm:col-start-auto"
            >
              리뷰 작성
            </Button>
          </article>
        ) : (
          <article
            key={review.id}
            className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 rounded-md border border-zinc-300 bg-white p-4 sm:grid-cols-[96px_minmax(0,1fr)] md:p-5"
          >
            <Link
              href={review.product.href}
              className="relative aspect-square overflow-hidden rounded-sm bg-zinc-100"
            >
              <Image
                src={review.product.thumbnailUrl}
                alt={review.product.name}
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-cover"
              />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <Link
                  href={review.product.href}
                  className="font-black text-black hover:underline"
                >
                  {review.product.name}
                </Link>
                <p className="text-xs font-bold text-zinc-400">
                  {review.createdAt}
                </p>
              </div>
              <p
                aria-label={'별점 ' + review.rating + '점'}
                className="mt-2 tracking-widest text-amber-400"
              >
                {'★'.repeat(review.rating)}
              </p>
              <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-700">
                {review.content}
              </p>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="outline" size="sm">
                  수정
                </Button>
                <Button type="button" variant="outline" size="sm">
                  삭제
                </Button>
              </div>
            </div>
          </article>
        ),
      )}
    </div>
  );
}
