import type { OrderStatusHistoryViewModel } from '@/domains/order';
import { MypageProcessingHistory } from '@/features/mypage/common';

interface MypageOrderDetailStatusHistoryProps {
  histories: readonly OrderStatusHistoryViewModel[];
}

export function MypageOrderDetailStatusHistory({
  histories,
}: MypageOrderDetailStatusHistoryProps) {
  return (
    <MypageProcessingHistory
      title="주문 처리 내역"
      histories={histories}
      collapsible
      mobileLayout="full-bleed"
    />
  );
}
