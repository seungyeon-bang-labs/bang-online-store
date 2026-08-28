import { INQUIRIES } from './fixture';
import type { InquiryRepository } from './repository';

export const fixtureInquiryRepository: InquiryRepository = {
  async findByUserId(userId) {
    return INQUIRIES.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async findByIdAndUserId(inquiryId, userId) {
    const inquiry = INQUIRIES.find(
      row => row.id === inquiryId && row.user_id === userId,
    );

    return inquiry ? { ...inquiry } : null;
  },
};
