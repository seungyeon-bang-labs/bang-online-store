'use server';

import {
  submitOrderCancellation,
  type OrderCancellationSubmitInput,
} from '@/domains/order';
import { currentUserRepository } from '@/domains/member';

export async function submitMypageOrderCancellationAction(
  orderId: string,
  orderItemId: string,
  input: OrderCancellationSubmitInput,
): Promise<boolean> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return false;

  return submitOrderCancellation(user.id, orderId, orderItemId, input);
}
