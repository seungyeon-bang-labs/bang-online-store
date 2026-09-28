'use server';

import {
  updateInquiry,
  type InquiryTextInput,
  type InquiryUpdateResult,
} from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';

export async function updateMypageInquiryAction(
  inquiryId: string,
  input: InquiryTextInput,
): Promise<InquiryUpdateResult> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return 'invalid';

  return updateInquiry(user.id, inquiryId, input);
}
