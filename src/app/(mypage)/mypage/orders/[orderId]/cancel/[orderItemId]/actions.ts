'use server';

import { requireActiveMember } from '@/app/(auth)/require-active-member';

import {
  submitOrderCancellation,
  type OrderCancellationSubmitInput,
} from '@/domains/order';

export async function submitMypageOrderCancellationAction(
  orderId: string,
  orderItemId: string,
  input: OrderCancellationSubmitInput,
): Promise<boolean> {
  const user = await requireActiveMember();

  return submitOrderCancellation(user.id, orderId, orderItemId, input);
}
