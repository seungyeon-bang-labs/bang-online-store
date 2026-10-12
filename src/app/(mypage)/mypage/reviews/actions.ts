'use server';

import { requireActiveMember } from '@/app/(auth)/require-active-member';

import {
  canDeleteReview,
  createReview,
  type ReviewCreateResult,
} from '@/domains/activity';

export async function deleteMypageReviewAction(
  reviewId: string,
): Promise<boolean> {
  const user = await requireActiveMember();


  return canDeleteReview(user.id, reviewId);
}

export async function createMypageReviewAction(
  orderItemId: string,
  input: { rating: number; content: string },
): Promise<ReviewCreateResult> {
  const user = await requireActiveMember();

  return createReview(user.id, orderItemId, input);
}
