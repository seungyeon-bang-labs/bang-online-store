import { MypageSubmissionResult } from '@/features/mypage/common/submission-result';

interface MypageInquiryEditSubmissionResultProps {
  returnHref: string;
}

export function MypageInquiryEditSubmissionResult({
  returnHref,
}: MypageInquiryEditSubmissionResultProps) {
  return (
    <MypageSubmissionResult
      title="문의 수정 내용을 확인했습니다."
      description="데모 환경에서는 문의 내역에 반영되지 않습니다."
      action={{ href: returnHref, label: '문의 내역으로' }}
    />
  );
}
