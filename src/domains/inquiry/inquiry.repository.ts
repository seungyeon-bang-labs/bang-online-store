import type { InquiryDTO } from './inquiry.dto';

export interface InquiryRepository {
  findByUserId(userId: string): Promise<InquiryDTO[]>;
}
