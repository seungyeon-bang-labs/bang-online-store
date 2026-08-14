import { Textarea } from '@/components/ui/textarea';
import {
  getReviewContentLength,
  REVIEW_CONTENT_MAX_LENGTH,
  REVIEW_CONTENT_MIN_LENGTH,
} from '@/domains/activity/domain';

interface ReviewContentFieldProps {
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export function ReviewContentField({
  value,
  error,
  onChange,
}: ReviewContentFieldProps) {
  const contentLength = getReviewContentLength(value);

  return (
    <div className="mt-7">
      <label htmlFor="review-content" className="font-black text-black">
        리뷰 내용
      </label>
      <Textarea
        id="review-content"
        value={value}
        onChange={event => onChange(event.target.value)}
        maxLength={REVIEW_CONTENT_MAX_LENGTH}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'review-content-error' : undefined}
        placeholder="상품을 사용해 본 솔직한 후기를 남겨 주세요."
        className="mt-2 min-h-36 resize-y rounded-sm border-zinc-300 bg-white text-sm font-medium shadow-none"
      />
      {error ? (
        <div className="mt-2 flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:gap-4">
          <p
            id="review-content-error"
            role="alert"
            className="order-2 text-sm font-medium text-red-600 sm:order-1"
          >
            {error}
          </p>
          <p className="order-1 self-end text-sm font-medium text-zinc-400 sm:order-2 sm:self-auto">
            {contentLength} / {REVIEW_CONTENT_MAX_LENGTH}자
          </p>
        </div>
      ) : (
        <div className="mt-2 flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-zinc-500">
            {REVIEW_CONTENT_MIN_LENGTH}자 이상 입력해 주세요.
          </p>
          <p className="shrink-0 text-sm font-medium text-zinc-400">
            {contentLength} / {REVIEW_CONTENT_MAX_LENGTH}자
          </p>
        </div>
      )}
    </div>
  );
}
