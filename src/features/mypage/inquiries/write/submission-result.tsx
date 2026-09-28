import { MypageSubmissionResult } from '@/features/mypage/common/submission-result';
import { getMypageInquiryListHref } from '@/shared/lib/mypage-routes';

export function MypageInquiryWriteSubmissionResult() {
  return (
    <MypageSubmissionResult
      title="문의가 작성되었습니다."
      action={{
        href: getMypageInquiryListHref(),
        label: '1:1 문의 내역',
      }}
    />
  );
}
