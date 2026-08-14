import { getReviewEditFormViewModel } from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import {
  MypageReviewForm,
  ReviewFormUnavailable,
} from '@/features/mypage/reviews';

interface ReviewEditPageProps {
  params: Promise<{ reviewId: string }>;
}

async function ReviewEditPage({ params }: ReviewEditPageProps) {
  const [{ reviewId }, user] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
  ]);
  const reviewFormViewModel = user
    ? await getReviewEditFormViewModel(user.id, reviewId)
    : null;

  return reviewFormViewModel ? (
    <MypageReviewForm viewModel={reviewFormViewModel} />
  ) : (
    <ReviewFormUnavailable mode="edit" />
  );
}

export default ReviewEditPage;
