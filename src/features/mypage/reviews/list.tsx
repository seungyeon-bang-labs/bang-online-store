import { MypageListStack } from '@/features/mypage/common/list-stack';
import type { ReviewItemViewModel } from '@/domains/activity/view-model';
import { AvailableReviewCard } from './available-card';
import { WrittenReviewCard } from './written-card';

interface MypageReviewListProps {
  reviews: readonly ReviewItemViewModel[];
  returnHref: string;
  deleteReviewAction: (reviewId: string) => Promise<boolean>;
}

export function MypageReviewList({
  reviews,
  returnHref,
  deleteReviewAction,
}: MypageReviewListProps) {
  return (
    <MypageListStack density="compact">
      {reviews.map(review =>
        review.kind === 'available' ? (
          <AvailableReviewCard
            key={review.orderItemId}
            review={review}
            returnHref={returnHref}
          />
        ) : (
          <WrittenReviewCard
            key={review.id}
            review={review}
            returnHref={returnHref}
            deleteReviewAction={deleteReviewAction}
          />
        ),
      )}
    </MypageListStack>
  );
}
