'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/shared/components/ui/button';
import {
  REVIEW_CONTENT_MAX_LENGTH,
  REVIEW_CONTENT_MIN_LENGTH,
  validateReviewForm,
} from '@/domains/activity/domain';
import {
  MypageFormCard,
  MypageFormFooter,
  MypageFormLabel,
  MypageFormUnavailable,
  MypagePageLayout,
} from '@/features/mypage/common';
import {
  MYPAGE_ACTION_CLASS_NAME,
  MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME,
} from '@/features/mypage/common/styles';
import { MypageCard } from '@/features/mypage/common/card';
import type {
  ReviewCreateResult,
  ReviewFormPageViewModel,
} from '@/domains/activity/view-model';
import { ReviewContentField } from './review-content-field';
import {
  REVIEW_FORM_COPY,
  REVIEW_LIST_BUTTON_LABEL,
} from './review-form.constants';
import { ReviewProductSummary } from './review-product-summary';
import { ReviewRatingInput } from './review-rating-input';
import { ReviewSubmissionResult } from './review-submission-result';

interface MypageReviewFormProps {
  viewModel: ReviewFormPageViewModel;
  returnHref: string;
  onCreateReview?: (
    orderItemId: string,
    input: { rating: number; content: string },
  ) => Promise<ReviewCreateResult>;
}

interface ReviewFormErrors {
  rating?: string;
  content?: string;
  submission?: string;
}

export function MypageReviewForm({
  viewModel,
  returnHref,
  onCreateReview,
}: MypageReviewFormProps) {
  const [rating, setRating] = useState(viewModel.initialRating);
  const [content, setContent] = useState(viewModel.initialContent);
  const [errors, setErrors] = useState<ReviewFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const copy = REVIEW_FORM_COPY[viewModel.mode];
  const isEditMode = viewModel.mode === 'edit';
  const isDirty =
    rating !== viewModel.initialRating || content !== viewModel.initialContent;

  async function submitReview() {
    if (isSubmitting) return;
    if (isEditMode && !isDirty) return;

    const { isRatingValid, isContentValid } = validateReviewForm({
      rating,
      content,
    });
    const nextErrors: ReviewFormErrors = {
      ...(!isRatingValid ? { rating: '별점을 선택해 주세요.' } : {}),
      ...(!isContentValid
        ? {
          content: `리뷰 내용은 ${REVIEW_CONTENT_MIN_LENGTH}자 이상 ${REVIEW_CONTENT_MAX_LENGTH}자 이하로 입력해 주세요.`,
        }
        : {}),
    };

    setErrors(nextErrors);

    if (!isRatingValid || !isContentValid) return;

    if (viewModel.mode !== 'create' || !onCreateReview) {
      setIsSubmitted(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onCreateReview(viewModel.orderItemId, {
        rating,
        content,
      });
      if (result === 'created') {
        setIsSubmitted(true);
      } else if (result === 'unavailable') {
        setIsUnavailable(true);
      } else {
        setErrors({
          submission: '리뷰를 작성하지 못했습니다. 다시 시도해 주세요.',
        });
      }
    } catch {
      setErrors({
        submission: '리뷰를 작성하지 못했습니다. 다시 시도해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRatingChange(nextRating: number) {
    setRating(nextRating);
    setErrors(current => ({
      ...current,
      rating: undefined,
      submission: undefined,
    }));
  }

  function handleContentChange(nextContent: string) {
    setContent(nextContent);

    if (validateReviewForm({ rating, content: nextContent }).isContentValid) {
      setErrors(current => ({
        ...current,
        content: undefined,
        submission: undefined,
      }));
      return;
    }

    setErrors(current => ({ ...current, submission: undefined }));
  }

  return (
    <MypagePageLayout mobileSpacing="flush">
      <MypageFormCard
        title={copy.title}
        mobileHeader="hide"
        mobileLayout="full-bleed"
      >
      {isUnavailable ? (
        <MypageFormUnavailable
          title="리뷰를 작성할 수 없습니다."
          description="현재 주문 상태에서는 리뷰를 작성할 수 없습니다. 나의 리뷰에서 작성 상태를 확인해 주세요."
          action={{ href: copy.listHref, label: REVIEW_LIST_BUTTON_LABEL }}
        />
      ) : isSubmitted ? (
        <ReviewSubmissionResult
          message={copy.successMessage}
          listHref={copy.listHref}
        />
      ) : (
        <>
          <ReviewProductSummary
            product={viewModel.product}
            productName={viewModel.productName}
            optionLabel={viewModel.optionLabel}
          />
          <form
            onSubmit={event => {
              event.preventDefault();
              void submitReview();
            }}
            noValidate
          >
            <MypageCard.Body className="border-t border-zinc-200">
              <fieldset>
                <MypageFormLabel as="legend">
                  상품은 어떠셨나요?
                </MypageFormLabel>
                <div className="mt-2 flex flex-col items-center sm:items-start sm:pl-3">
                  <ReviewRatingInput
                    value={rating}
                    onChange={handleRatingChange}
                    invalid={Boolean(errors.rating)}
                    describedBy={
                      errors.rating ? 'review-rating-error' : undefined
                    }
                  />
                  {errors.rating && (
                    <p
                      id="review-rating-error"
                      role="alert"
                      className="mt-2 text-sm font-medium text-red-600"
                    >
                      {errors.rating}
                    </p>
                  )}
                </div>
              </fieldset>
              <ReviewContentField
                value={content}
                error={errors.content}
                onChange={handleContentChange}
              />
            </MypageCard.Body>
            <MypageFormFooter errorMessage={errors.submission}>
              <ButtonLink
                href={returnHref}
                variant="outline"
                size="lg"
                className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.outline}`}
              >
                취소
              </ButtonLink>
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || (isEditMode && !isDirty)}
                className={`${MYPAGE_FORM_ACTION_BUTTON_CLASS_NAME} ${MYPAGE_ACTION_CLASS_NAME.primary}`}
              >
                {isSubmitting ? (isEditMode ? '수정 중' : '작성 중') : copy.submitLabel}
              </Button>
            </MypageFormFooter>
          </form>
        </>
      )}
      </MypageFormCard>
    </MypagePageLayout>
  );
}
