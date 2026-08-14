import type { ReviewItemViewModel } from '@/domains/activity/view-model';
import { AvailableReviewCard } from './available-card';
import { WrittenReviewCard } from './written-card';

interface MypageReviewListProps {
  reviews: readonly ReviewItemViewModel[];
}

export function MypageReviewList({ reviews }: MypageReviewListProps) {
  return (
    <div className="space-y-4">
      {reviews.map(review =>
        review.kind === 'available' ? (
          <AvailableReviewCard key={review.orderItemId} review={review} />
        ) : (
          <WrittenReviewCard key={review.id} review={review} />
        ),
      )}
    </div>
  );
}
