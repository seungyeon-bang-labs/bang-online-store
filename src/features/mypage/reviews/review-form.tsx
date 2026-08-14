'use client';

import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/button';
import {
  REVIEW_CONTENT_MAX_LENGTH,
  REVIEW_CONTENT_MIN_LENGTH,
  validateReviewForm,
} from '@/domains/activity/domain';
import type { ReviewFormPageViewModel } from '@/domains/activity/view-model';
import { ReviewContentField } from './review-content-field';
import { REVIEW_FORM_COPY } from './review-form.constants';
import { ReviewProductSummary } from './review-product-summary';
import { ReviewRatingInput } from './review-rating-input';
import { ReviewSubmissionResult } from './review-submission-result';

interface MypageReviewFormProps {
  viewModel: ReviewFormPageViewModel;
}

interface ReviewFormErrors {
  rating?: string;
  content?: string;
}

export function MypageReviewForm({ viewModel }: MypageReviewFormProps) {
  const [rating, setRating] = useState(viewModel.initialRating);
  const [content, setContent] = useState(viewModel.initialContent);
  const [errors, setErrors] = useState<ReviewFormErrors>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const copy = REVIEW_FORM_COPY[viewModel.mode];

  function submitReview() {
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

    if (isRatingValid && isContentValid) {
      setIsSubmitted(true);
    }
  }

  function handleRatingChange(nextRating: number) {
    setRating(nextRating);
    setErrors(current =>
      current.rating ? { content: current.content } : current,
    );
  }

  function handleContentChange(nextContent: string) {
    setContent(nextContent);

    if (validateReviewForm({ rating, content: nextContent }).isContentValid) {
      setErrors(current =>
        current.content ? { rating: current.rating } : current,
      );
    }
  }

  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-300 px-4 py-4 md:px-5">
        <h2 className="text-xl font-black tracking-tight text-black">
          {copy.title}
        </h2>
      </header>
      <ReviewProductSummary
        product={viewModel.product}
        productName={viewModel.productName}
        optionLabel={viewModel.optionLabel}
      />
      <div className="border-t border-zinc-300 p-4 md:p-5">
        {isSubmitted ? (
          <ReviewSubmissionResult
            message={copy.successMessage}
            listHref={copy.listHref}
          />
        ) : (
          <form
            onSubmit={event => {
              event.preventDefault();
              submitReview();
            }}
            noValidate
          >
            <fieldset>
              <legend className="font-black text-black">
                상품은 어떠셨나요?
              </legend>
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
            <div className="mt-8 grid grid-cols-2 gap-2">
              <ButtonLink
                href={copy.listHref}
                variant="outline"
                className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-white hover:text-black"
              >
                취소
              </ButtonLink>
              <Button
                type="submit"
                className="w-full rounded-sm bg-black font-bold text-white hover:bg-zinc-800"
              >
                {copy.submitLabel}
              </Button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}
