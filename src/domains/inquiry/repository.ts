import type { InquiryDTO } from './dto';

export interface InquiryRepository {
  create(inquiry: InquiryDTO): Promise<void>;
  findByUserId(userId: string): Promise<InquiryDTO[]>;
  findByIdAndUserId(
    inquiryId: string,
    userId: string,
  ): Promise<InquiryDTO | null>;
}
