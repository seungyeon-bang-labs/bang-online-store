import { CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import type { OrderClaimRequestType } from '@/domains/order/claim/domain';

interface MypageClaimRequestSubmissionResultProps {
  type: OrderClaimRequestType;
}

export function MypageClaimRequestSubmissionResult({
  type,
}: MypageClaimRequestSubmissionResultProps) {
  const label = type === 'exchange' ? '교환' : '반품';

  return (
    <div className="flex min-h-72 flex-col items-center justify-center p-5 text-center">
      <CheckCircle2 className="size-9 text-black" aria-hidden="true" />
      <p className="mt-4 text-base font-black text-black">
        {label} 신청이 접수되었습니다.
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-500">
        {type === 'exchange'
          ? '회수·검수 및 교환 상품 발송 일정은 교환·반품 내역에서 확인할 수 있습니다.'
          : '회수 및 환불 처리 일정은 교환·반품 내역에서 확인할 수 있습니다.'}
      </p>
      <ButtonLink
        href="/mypage/returns?type=all&status=all&page=1"
        variant="outline"
        className="mt-6 rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
      >
        교환·반품 내역으로
      </ButtonLink>
    </div>
  );
}
