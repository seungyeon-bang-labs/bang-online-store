'use server';

import {
  canDeleteReview,
  createReview,
  type ReviewCreateResult,
} from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';

export async function deleteMypageReviewAction(
  reviewId: string,
): Promise<boolean> {
  const user = await currentUserRepository.findCurrent();

  if (!user) return false;

  return canDeleteReview(user.id, reviewId);
}

export async function createMypageReviewAction(
  orderItemId: string,
  input: { rating: number; content: string },
): Promise<ReviewCreateResult> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return 'invalid';

  return createReview(user.id, orderItemId, input);
}
