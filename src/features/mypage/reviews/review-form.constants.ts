import { REVIEW_WRITE_DEADLINE_DAYS } from '@/domains/activity/domain';
import type { ReviewFormMode } from '@/domains/activity/view-model';

interface ReviewFormCopy {
  title: string;
  submitLabel: string;
  successMessage: string;
  listHref: string;
  unavailableTitle: string;
  unavailableDescription: string;
}

export const REVIEW_FORM_COPY = {
  create: {
    title: '리뷰 작성',
    submitLabel: '리뷰 작성',
    successMessage: '리뷰가 등록되었습니다.',
    listHref: '/mypage/reviews?tab=available&page=1',
    unavailableTitle: '리뷰를 작성할 수 없는 상품입니다.',
    unavailableDescription:
      `배송 완료 후 ${REVIEW_WRITE_DEADLINE_DAYS}일 이내이며, 취소·완료된 교환 또는 반품이 없는 상품만 리뷰를 작성할 수 있습니다.`,
  },
  edit: {
    title: '리뷰 수정',
    submitLabel: '수정 완료',
    successMessage: '리뷰가 수정되었습니다.',
    listHref: '/mypage/reviews?tab=completed&page=1',
    unavailableTitle: '수정할 리뷰를 찾을 수 없습니다.',
    unavailableDescription: '나의 리뷰에서 수정할 리뷰를 다시 선택해 주세요.',
  },
} satisfies Record<ReviewFormMode, ReviewFormCopy>;

export const REVIEW_LIST_BUTTON_LABEL = '나의 리뷰 목록으로';
