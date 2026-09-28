import { getReviewWritePageViewModel } from '@/domains/activity';
import { currentUserRepository } from '@/domains/member';
import { MypageFormCard, MypageFormUnavailable } from '@/features/mypage/common';
import { MypageReviewForm } from '@/features/mypage/reviews';
import {
  REVIEW_FORM_COPY,
  REVIEW_LIST_BUTTON_LABEL,
  REVIEW_WRITE_UNAVAILABLE_COPY,
} from '@/features/mypage/reviews/review-form.constants';
import { notFound } from 'next/navigation';
import { resolveMypageReviewReturnHref } from '@/shared/lib/mypage-routes';
import { createMypageReviewAction } from '../../actions';

interface ReviewWritePageProps {
  params: Promise<{ orderItemId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}

async function ReviewWritePage({
  params,
  searchParams,
}: ReviewWritePageProps) {
  const [{ orderItemId }, { returnTo }, user] = await Promise.all([
    params,
    searchParams,
    currentUserRepository.findCurrent(),
  ]);
  const reviewWritePageViewModel = user
    ? await getReviewWritePageViewModel(user.id, orderItemId)
    : null;

  if (!reviewWritePageViewModel) notFound();

  return reviewWritePageViewModel.kind === 'writable' ? (
    <MypageReviewForm
      viewModel={reviewWritePageViewModel.form}
      returnHref={resolveMypageReviewReturnHref({
        orderId: reviewWritePageViewModel.form.orderId,
        returnTo,
        fallbackHref: '/mypage/reviews?tab=available&page=1',
      })}
      onCreateReview={createMypageReviewAction}
    />
  ) : (
    <div className="-mt-5 md:mt-0">
      <MypageFormCard
        title={REVIEW_FORM_COPY.create.title}
        mobileHeader="hide"
        mobileLayout="full-bleed"
      >
        <MypageFormUnavailable
          title="리뷰를 작성할 수 없습니다."
          description={
            REVIEW_WRITE_UNAVAILABLE_COPY[reviewWritePageViewModel.reason]
          }
          action={{
            href: REVIEW_FORM_COPY.create.listHref,
            label: REVIEW_LIST_BUTTON_LABEL,
          }}
        />
      </MypageFormCard>
    </div>
  );
}

export default ReviewWritePage;
