import { Textarea } from '@/shared/components/ui/textarea';
import {
  getReviewContentLength,
  REVIEW_CONTENT_MAX_LENGTH,
  REVIEW_CONTENT_MIN_LENGTH,
} from '@/domains/activity/domain';
import {
  MypageFormField,
  MypageFormLabel,
  MypageTextareaCharacterCount,
} from '@/features/mypage/common';
import { MYPAGE_TEXTAREA_CLASS_NAME } from '@/features/mypage/common/styles';

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
    <MypageFormField className="mt-6 gap-0">
      <MypageFormLabel htmlFor="review-content">
        리뷰 내용
      </MypageFormLabel>
      <div className="relative mt-2">
        <Textarea
          id="review-content"
          value={value}
          onChange={event => onChange(event.target.value)}
          maxLength={REVIEW_CONTENT_MAX_LENGTH}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'review-content-error' : undefined}
          placeholder="상품을 사용해 본 솔직한 후기를 남겨 주세요."
          className={`min-h-36 resize-y pb-10 ${MYPAGE_TEXTAREA_CLASS_NAME}`}
        />
        <MypageTextareaCharacterCount
          current={contentLength}
          max={REVIEW_CONTENT_MAX_LENGTH}
        />
      </div>
      {error ? (
        <div className="mt-2">
          <p
            id="review-content-error"
            role="alert"
            className="text-sm font-medium text-red-600"
          >
            {error}
          </p>
        </div>
      ) : (
        <div className="mt-2">
          <p className="text-sm font-medium text-zinc-500">
            {REVIEW_CONTENT_MIN_LENGTH}자 이상 입력해 주세요.
          </p>
        </div>
      )}
    </MypageFormField>
  );
}
