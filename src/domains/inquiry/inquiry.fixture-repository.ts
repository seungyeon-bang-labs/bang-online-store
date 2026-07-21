import { INQUIRIES } from './inquiry.fixture';
import type { InquiryRepository } from './inquiry.repository';

export const fixtureInquiryRepository: InquiryRepository = {
  async findByUserId(userId) {
    return INQUIRIES.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
};
