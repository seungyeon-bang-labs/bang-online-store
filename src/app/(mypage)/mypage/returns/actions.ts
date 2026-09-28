'use server';

import { cancelOrderClaim } from '@/domains/order';
import { currentUserRepository } from '@/domains/member';

export async function cancelMypageOrderClaimAction(
  claimId: string,
): Promise<boolean> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return false;

  return cancelOrderClaim(user.id, claimId);
}
