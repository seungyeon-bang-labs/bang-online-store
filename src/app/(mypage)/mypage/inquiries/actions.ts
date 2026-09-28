'use server';

import { cancelInquiry, createInquiry, type InquiryType } from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';

export async function cancelMypageInquiryAction(
  inquiryId: string,
): Promise<boolean> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return false;

  return cancelInquiry(user.id, inquiryId);
}

export async function createMypageInquiryAction(input: {
  type: InquiryType;
  title: string;
  content: string;
  orderId: string;
  orderItemId: string;
  productId: string;
}): Promise<boolean> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return false;

  return createInquiry(user.id, input);
}
