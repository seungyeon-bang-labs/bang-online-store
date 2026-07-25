import type { StatusViewModel } from '@/shared/types/status';

export interface InquiryViewModel {
  id: string;
  typeLabel: string;
  title: string;
  content: string;
  status: StatusViewModel;
  answerContent: string | null;
  answeredAt: string | null;
  createdAt: string;
}
