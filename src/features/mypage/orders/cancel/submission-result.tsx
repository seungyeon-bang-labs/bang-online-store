import { CheckCircle2 } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { getMypageOrderDetailHref } from '@/shared/lib/mypage-routes';

interface MypageOrderCancellationSubmissionResultProps {
  orderId: string;
}

export function MypageOrderCancellationSubmissionResult({
  orderId,
}: MypageOrderCancellationSubmissionResultProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center p-5 text-center">
      <CheckCircle2 className="size-9 text-black" aria-hidden="true" />
      <p className="mt-4 text-base font-black text-black">
        주문 취소 신청 내용을 확인했습니다.
      </p>
      <p className="mt-2 text-sm font-medium text-zinc-500">
        데모 환경에서는 주문 상태와 환불 내역이 변경되지 않습니다.
      </p>
      <div className="mt-6 grid w-full max-w-sm grid-cols-2 gap-2">
        <ButtonLink
          href={getMypageOrderDetailHref(orderId)}
          variant="outline"
          className="w-full rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-white hover:text-black"
        >
          주문 상세로
        </ButtonLink>
        <ButtonLink
          href="/mypage/orders?period=3-months&status=all&page=1"
          className="w-full rounded-sm bg-black font-bold text-white hover:bg-zinc-800"
        >
          주문 내역으로
        </ButtonLink>
      </div>
    </div>
  );
}
