'use server';

import { requireActiveMember } from '@/app/(auth)/require-active-member';

import { cancelInquiry, createInquiry, type InquiryType } from '@/domains/inquiry';

export async function cancelMypageInquiryAction(
  inquiryId: string,
): Promise<boolean> {
  const user = await requireActiveMember();

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
  const user = await requireActiveMember();

  return createInquiry(user.id, input);
}
