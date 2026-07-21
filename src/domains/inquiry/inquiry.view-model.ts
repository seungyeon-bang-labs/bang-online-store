import type { StatusViewModel } from '@/domains/mypage/mypage-status.view-model';

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
