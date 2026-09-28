import { getReviewEditFormViewModel } from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import { MypageReviewForm } from '@/features/mypage/reviews';
import { notFound } from 'next/navigation';
import { resolveMypageReviewReturnHref } from '@/shared/lib/mypage-routes';

interface ReviewEditPageProps {
  params: Promise<{ reviewId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}

async function ReviewEditPage({
  params,
  searchParams,
}: ReviewEditPageProps) {
  const [{ reviewId }, { returnTo }, user] = await Promise.all([
    params,
    searchParams,
    currentUserRepository.findCurrent(),
  ]);
  const reviewFormViewModel = user
    ? await getReviewEditFormViewModel(user.id, reviewId)
    : null;

  if (!reviewFormViewModel) notFound();

  return (
    <MypageReviewForm
      viewModel={reviewFormViewModel}
      returnHref={resolveMypageReviewReturnHref({
        orderId: reviewFormViewModel.orderId,
        returnTo,
        fallbackHref: '/mypage/reviews?tab=completed&page=1',
      })}
    />
  );
}

export default ReviewEditPage;
