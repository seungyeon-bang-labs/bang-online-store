import type { InquiryDTO } from './dto';

export interface InquiryRepository {
  findByUserId(userId: string): Promise<InquiryDTO[]>;
  findByIdAndUserId(
    inquiryId: string,
    userId: string,
  ): Promise<InquiryDTO | null>;
}
