import { REVIEW_WRITE_DEADLINE_DAYS } from '@/domains/activity/domain';
import type { ReviewWriteUnavailableReason } from '@/domains/activity/domain';
import type { ReviewFormMode } from '@/domains/activity/view-model';
import { getMypageCompletedReviewListHref } from '@/shared/lib/mypage-routes';

interface ReviewFormCopy {
  title: string;
  submitLabel: string;
  successMessage: string;
  listHref: string;
}

export const REVIEW_FORM_COPY = {
  create: {
    title: '리뷰 작성',
    submitLabel: '리뷰 작성',
    successMessage: '리뷰가 등록되었습니다.',
    listHref: getMypageCompletedReviewListHref(),
  },
  edit: {
    title: '리뷰 수정',
    submitLabel: '수정 완료',
    successMessage: '리뷰가 수정되었습니다.',
    listHref: '/mypage/reviews?tab=completed&page=1',
  },
} satisfies Record<ReviewFormMode, ReviewFormCopy>;

export const REVIEW_LIST_BUTTON_LABEL = '나의 리뷰';

export const REVIEW_WRITE_UNAVAILABLE_COPY: Record<
  ReviewWriteUnavailableReason,
  string
> = {
  not_delivered: '배송 완료된 상품만 리뷰를 작성할 수 있습니다.',
  expired: `배송 완료 후 ${REVIEW_WRITE_DEADLINE_DAYS}일 이내에만 리뷰를 작성할 수 있습니다.`,
  already_written: '이미 이 상품에 작성한 리뷰가 있습니다.',
  cancelled: '취소한 상품은 리뷰를 작성할 수 없습니다.',
  completed_claim: '교환 또는 반품 처리가 완료된 상품은 리뷰를 작성할 수 없습니다.',
};
