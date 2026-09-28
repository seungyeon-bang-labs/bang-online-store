import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';
import { ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import type { WrittenReviewViewModel } from '@/domains/activity/view-model';
import { MypageCard, MypageCardContentBlock } from '@/features/mypage/common';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';
import {
  getMypageOrderDetailHref,
  getMypageReviewEditHref,
} from '@/shared/lib/mypage-routes';
import { MypageReviewDeleteButton } from './delete-button';

interface WrittenReviewCardProps {
  review: WrittenReviewViewModel;
  returnHref: string;
  deleteReviewAction: (reviewId: string) => Promise<boolean>;
}

export function WrittenReviewCard({
  review,
  returnHref,
  deleteReviewAction,
}: WrittenReviewCardProps) {
  return (
    <MypageCard as="article">
      <MypageCard.Body className="pb-0 md:pb-0">
        <MypageProductSummary
          thumbnail={
            <MypageProductThumbnailLink
              href={review.product.href}
              src={review.product.thumbnailUrl}
              alt={review.product.name}
            />
          }
          name={review.product.name}
          nameHref={review.product.href}
          meta={review.optionLabel}
          truncateName
          action={
            <Link
              href={getMypageOrderDetailHref(review.orderId)}
              className="mt-1 inline-flex w-fit items-center gap-0.5 text-xs font-bold text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              주문 상세 보기
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          }
        />
        <MypageCardContentBlock
          title="리뷰"
          meta={review.createdAt}
          className="mt-4"
        >
          <p
            aria-label={'별점 ' + review.rating + '점'}
            className="flex items-center gap-1"
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                aria-hidden="true"
                className={
                  index < review.rating
                    ? 'size-[18px] fill-amber-400 text-amber-400'
                    : 'size-[18px] text-zinc-300'
                }
              />
            ))}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm font-medium leading-relaxed text-zinc-700">
            {review.content}
          </p>
        </MypageCardContentBlock>
      </MypageCard.Body>
      <MypageCard.Footer>
        <div className="grid grid-cols-2 gap-2">
          <MypageReviewDeleteButton
            reviewId={review.id}
            canDelete={review.canDelete}
            deleteAvailableAt={review.deleteAvailableAt}
            deleteReviewAction={deleteReviewAction}
          />
          <Button
            asChild
            type="button"
            variant="outline"
            size="sm"
            className={`w-full ${MYPAGE_ACTION_CLASS_NAME.outline}`}
          >
            <Link href={getMypageReviewEditHref(review.id, returnHref)}>
              수정
            </Link>
          </Button>
        </div>
      </MypageCard.Footer>
    </MypageCard>
  );
}
