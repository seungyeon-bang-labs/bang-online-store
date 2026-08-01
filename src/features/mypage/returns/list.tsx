import type { OrderClaimViewModel } from '@/domains/order';
import { MypageClaimCard } from './card';

interface MypageClaimListProps {
  claims: OrderClaimViewModel[];
}

export function MypageClaimList({ claims }: MypageClaimListProps) {
  return (
    <div className="space-y-6">
      {claims.map(claim => (
        <MypageClaimCard key={claim.id} claim={claim} />
      ))}
    </div>
  );
}
