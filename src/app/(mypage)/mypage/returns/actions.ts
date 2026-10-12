'use server';

import { requireActiveMember } from '@/app/(auth)/require-active-member';

import { cancelOrderClaim } from '@/domains/order';

export async function cancelMypageOrderClaimAction(
  claimId: string,
): Promise<boolean> {
  const user = await requireActiveMember();

  return cancelOrderClaim(user.id, claimId);
}
