import type { InquiryDTO } from './dto';

export interface InquiryRepository {
  findByUserId(userId: string): Promise<InquiryDTO[]>;
}
