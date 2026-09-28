import { MypageListStack } from '@/features/mypage/common/list-stack';
import type { OrderClaimViewModel } from '@/domains/order/claim/view-model';
import { MypageClaimCard } from './card';

interface MypageClaimListProps {
  claims: OrderClaimViewModel[];
  cancelOrderClaimAction: (claimId: string) => Promise<boolean>;
}

export function MypageClaimList({
  claims,
  cancelOrderClaimAction,
}: MypageClaimListProps) {
  return (
    <MypageListStack density="compact">
      {claims.map(claim => (
        <MypageClaimCard
          key={claim.id}
          claim={claim}
          cancelOrderClaimAction={cancelOrderClaimAction}
        />
      ))}
    </MypageListStack>
  );
}
