import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';
import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import type { AvailableReviewViewModel } from '@/domains/activity/view-model';
import { MypageBadge, MypageCard } from '@/features/mypage/common';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';
import { getMypageReviewWriteHref } from '@/shared/lib/mypage-routes';

interface AvailableReviewCardProps {
  review: AvailableReviewViewModel;
  returnHref: string;
}

export function AvailableReviewCard({
  review,
  returnHref,
}: AvailableReviewCardProps) {
  return (
    <MypageCard as="article">
      <MypageCard.Header>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <MypageBadge label={review.reviewDeadlineDday} tone="danger" />
          <p className="text-sm font-bold text-zinc-700">
            {review.reviewDeadlineAt}까지 리뷰 작성 가능
          </p>
        </div>
      </MypageCard.Header>
      <MypageCard.Body className="pb-0 md:pb-0">
        <MypageProductSummary
          thumbnail={
            <MypageProductThumbnailLink
              href={review.product.href}
              src={review.product.thumbnailUrl}
              alt={review.productName}
            />
          }
          name={review.productName}
          nameHref={review.product.href}
          meta={review.optionLabel}
          truncateName
        />
      </MypageCard.Body>
      <MypageCard.Footer>
        <Button
          asChild
          type="button"
          variant="outline"
          size="sm"
          className={`w-full ${MYPAGE_ACTION_CLASS_NAME.outline}`}
        >
          <Link href={getMypageReviewWriteHref(review.orderItemId, returnHref)}>
            리뷰 작성
          </Link>
        </Button>
      </MypageCard.Footer>
    </MypageCard>
  );
}
