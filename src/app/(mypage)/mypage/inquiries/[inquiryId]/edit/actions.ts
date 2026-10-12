'use server';

import { requireActiveMember } from '@/app/(auth)/require-active-member';

import {
  updateInquiry,
  type InquiryTextInput,
  type InquiryUpdateResult,
} from '@/domains/inquiry';

export async function updateMypageInquiryAction(
  inquiryId: string,
  input: InquiryTextInput,
): Promise<InquiryUpdateResult> {
  const user = await requireActiveMember();

  return updateInquiry(user.id, inquiryId, input);
}
