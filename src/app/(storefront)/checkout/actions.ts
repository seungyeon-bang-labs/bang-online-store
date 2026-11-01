'use server';

import { unstable_rethrow } from 'next/navigation';
import { requireActiveMember } from '@/app/(auth)/require-active-member';
import {
  placeOrderRequestSchema,
  type PlaceOrderResult,
} from '@/domains/order/place-order';
import { createOrderPlacementRepository } from '@/domains/order/supabase-repository.server';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';

// The member comes from the session, never from the form; place_order checks it again.
export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  const member = await requireActiveMember();
  const parsed = placeOrderRequestSchema.safeParse(input);
  if (!parsed.success) return { status: 'rejected', reason: 'failed' };

  try {
    const repository = createOrderPlacementRepository(await createAuthClient());

    return await repository.placeOrder({ userId: member.id, ...parsed.data });
  } catch (error) {
    unstable_rethrow(error);
    return { status: 'rejected', reason: 'failed' };
  }
}
