'use server';

import { revalidatePath } from 'next/cache';
import { cancelOrderItems } from '@/domains/order';

export async function cancelDemoOrderItem(
  orderId: string,
  orderItemId: string,
): Promise<void> {
  await cancelOrderItems(orderId, [orderItemId]);
  revalidatePath('/mypage');
  revalidatePath('/mypage/orders');
  revalidatePath(`/mypage/orders/${orderId}`);
  revalidatePath(`/mypage/orders/${orderId}/receipt`);
}
