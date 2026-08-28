import { getInquiryActionEligibility } from './domain';
import type { InquiryRepository } from './repository';

export interface InquiryCancelService {
  cancelInquiry(userId: string, inquiryId: string): Promise<boolean>;
}

export function createInquiryCancelService({
  inquiryRepository,
}: {
  inquiryRepository: InquiryRepository;
}): InquiryCancelService {
  async function cancelInquiry(
    userId: string,
    inquiryId: string,
  ): Promise<boolean> {
    const inquiry = await inquiryRepository.findByIdAndUserId(inquiryId, userId);
    if (!inquiry || !getInquiryActionEligibility(inquiry.status).canCancel) {
      return false;
    }

    return true;
  }

  return { cancelInquiry };
}
