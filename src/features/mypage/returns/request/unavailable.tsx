import { CircleAlert } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import type { OrderClaimRequestUnavailableReason } from '@/domains/order/claim/domain';
import { MypageEmptyState } from '@/features/mypage/common';

const UNAVAILABLE_COPY: Record<OrderClaimRequestUnavailableReason, string> = {
  not_delivered: '배송 완료된 상품만 교환 또는 반품을 신청할 수 있습니다.',
  expired: '상품 수령 후 7일 이내에만 교환 또는 반품을 신청할 수 있습니다.',
  cancelled: '취소된 상품은 교환 또는 반품을 신청할 수 없습니다.',
  already_claimed: '이미 교환 또는 반품이 접수된 상품입니다.',
};

interface MypageClaimRequestUnavailableProps {
  orderId: string;
  reason: OrderClaimRequestUnavailableReason | null;
}

export function MypageClaimRequestUnavailable({
  orderId,
  reason,
}: MypageClaimRequestUnavailableProps) {
  return (
    <div className="space-y-5">
      <MypageEmptyState
        icon={CircleAlert}
        title="교환·반품을 신청할 수 없습니다."
        description={
          reason ? UNAVAILABLE_COPY[reason] : '주문 상세에서 상품을 다시 선택해 주세요.'
        }
      />
      <div className="flex justify-center">
        <ButtonLink
          href={`/mypage/orders/${orderId}`}
          variant="outline"
          className="rounded-sm border-zinc-300 font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
        >
          주문 상세로
        </ButtonLink>
      </div>
    </div>
  );
}
