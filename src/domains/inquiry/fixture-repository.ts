import { INQUIRIES } from './fixture';
import type { InquiryRepository } from './repository';

let demoInquiries = INQUIRIES.map(inquiry => ({ ...inquiry }));

export const fixtureInquiryRepository: InquiryRepository = {
  async create(inquiry) {
    demoInquiries = [{ ...inquiry }, ...demoInquiries];
  },
  async findByUserId(userId) {
    return demoInquiries.filter(row => row.user_id === userId)
      .map(row => ({ ...row }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async findByIdAndUserId(inquiryId, userId) {
    const inquiry = demoInquiries.find(
      row => row.id === inquiryId && row.user_id === userId,
    );

    return inquiry ? { ...inquiry } : null;
  },
};
