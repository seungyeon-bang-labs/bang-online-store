'use server';

import { updateInquiry, type InquiryTextInput } from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';

export async function updateMypageInquiryAction(
  inquiryId: string,
  input: InquiryTextInput,
): Promise<boolean> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return false;

  return updateInquiry(user.id, inquiryId, input);
}
