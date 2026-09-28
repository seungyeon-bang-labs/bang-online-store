import type { OrderClaimRequestType } from '@/domains/order/claim/domain';
import { MypageSubmissionResult } from '@/features/mypage/common/submission-result';
import { getMypageOrderClaimListHref } from '@/shared/lib/mypage-routes';

interface MypageClaimRequestSubmissionResultProps {
  type: OrderClaimRequestType;
}

export function MypageClaimRequestSubmissionResult({
  type,
}: MypageClaimRequestSubmissionResultProps) {
  const label = type === 'exchange' ? '교환' : '반품';

  return (
    <MypageSubmissionResult
      title={`${label} 신청이 접수되었습니다.`}
      description={type === 'exchange'
        ? '회수·검수 및 교환 상품 발송 일정은 교환·반품 내역에서 확인할 수 있습니다.'
        : '회수 및 환불 처리 일정은 교환·반품 내역에서 확인할 수 있습니다.'}
      action={{
        href: getMypageOrderClaimListHref(),
        label: '교환·반품 내역으로',
      }}
    />
  );
}
