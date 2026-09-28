import { isReviewDeletable } from './domain';
import type { ReviewRepository } from './repository';

export interface ReviewDeletionService {
  canDeleteReview(userId: string, reviewId: string): Promise<boolean>;
}

export function createReviewDeletionService({
  reviewRepository,
}: {
  reviewRepository: ReviewRepository;
}): ReviewDeletionService {
  async function canDeleteReview(
    userId: string,
    reviewId: string,
  ): Promise<boolean> {
    const review = await reviewRepository.findById(reviewId);

    return (
      review !== null &&
      review.user_id === userId &&
      isReviewDeletable(review.created_at)
    );
  }

  return { canDeleteReview };
}
