import { MypageSubmissionResult } from '@/features/mypage/common/submission-result';

interface ReviewSubmissionResultProps {
  message: string;
  listHref: string;
}

export function ReviewSubmissionResult({
  message,
  listHref,
}: ReviewSubmissionResultProps) {
  return (
    <MypageSubmissionResult
      title={message}
      action={{ href: listHref, label: '나의 리뷰' }}
    />
  );
}
