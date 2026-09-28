import { getMypageCancelledOrderListHref } from '@/shared/lib/mypage-routes';
import { MypageSubmissionResult } from '@/features/mypage/common/submission-result';

export function MypageOrderCancellationSubmissionResult() {
  return (
    <MypageSubmissionResult
      title="주문 취소 신청이 완료되었습니다."
      action={{ href: getMypageCancelledOrderListHref(), label: '주문 내역' }}
    />
  );
}
