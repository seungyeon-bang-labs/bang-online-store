import { canCancelOrderClaim } from './domain';
import type { OrderClaimRepository } from './repository';

export interface ClaimCancelService {
  cancelOrderClaim(userId: string, claimId: string): Promise<boolean>;
}

export function createClaimCancelService({
  orderClaimRepository,
}: {
  orderClaimRepository: OrderClaimRepository;
}): ClaimCancelService {
  async function cancelOrderClaim(
    userId: string,
    claimId: string,
  ): Promise<boolean> {
    const claim = await orderClaimRepository.findById(claimId);

    return Boolean(
      claim &&
        claim.user_id === userId &&
        canCancelOrderClaim(claim),
    );
  }

  return { cancelOrderClaim };
}
