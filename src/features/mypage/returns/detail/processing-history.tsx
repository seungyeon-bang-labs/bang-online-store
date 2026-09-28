import type { OrderClaimDetailProcessingHistoryViewModel } from '@/domains/order/claim/view-model';
import { MypageProcessingHistory } from '@/features/mypage/common';

interface MypageClaimDetailProcessingHistoryProps {
  processingHistory: OrderClaimDetailProcessingHistoryViewModel;
}

export function MypageClaimDetailProcessingHistory({
  processingHistory,
}: MypageClaimDetailProcessingHistoryProps) {
  return (
    <MypageProcessingHistory
      collapsible
      title="교환·반품 처리 내역"
      histories={processingHistory.histories}
    />
  );
}
