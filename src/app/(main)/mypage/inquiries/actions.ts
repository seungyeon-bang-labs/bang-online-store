'use server';

import { cancelInquiry } from '@/domains/inquiry';
import { currentUserRepository } from '@/domains/member';

export async function cancelMypageInquiryAction(
  inquiryId: string,
): Promise<boolean> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return false;

  return cancelInquiry(user.id, inquiryId);
}
