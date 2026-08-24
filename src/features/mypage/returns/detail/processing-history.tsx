import type { OrderClaimDetailProcessingHistoryViewModel } from '@/domains/order/claim/view-model';
import { MypageProcessingHistoryList } from '@/features/mypage/common';
import { MypageClaimDetailCollapsibleCard } from './collapsible-card';

interface MypageClaimDetailProcessingHistoryProps {
  processingHistory: OrderClaimDetailProcessingHistoryViewModel;
}

export function MypageClaimDetailProcessingHistory({
  processingHistory,
}: MypageClaimDetailProcessingHistoryProps) {
  return (
    <MypageClaimDetailCollapsibleCard title="교환·반품 처리 내역">
      <MypageProcessingHistoryList histories={processingHistory.histories} />
    </MypageClaimDetailCollapsibleCard>
  );
}
