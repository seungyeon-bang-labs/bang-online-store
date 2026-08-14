import { getReviewWriteFormViewModel } from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import {
  MypageReviewForm,
  ReviewFormUnavailable,
} from '@/features/mypage/reviews';

interface ReviewWritePageProps {
  params: Promise<{ orderItemId: string }>;
}

async function ReviewWritePage({ params }: ReviewWritePageProps) {
  const [{ orderItemId }, user] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
  ]);
  const reviewFormViewModel = user
    ? await getReviewWriteFormViewModel(user.id, orderItemId)
    : null;

  return reviewFormViewModel ? (
    <MypageReviewForm viewModel={reviewFormViewModel} />
  ) : (
    <ReviewFormUnavailable mode="create" />
  );
}

export default ReviewWritePage;
