import type { InquiryType } from './dto';
import type { InquiryWriteViewModel } from './write.view-model';

export interface InquiryEditViewModel extends InquiryWriteViewModel {
  inquiry: {
    id: string;
    type: InquiryType;
    title: string;
    content: string;
  };
}
