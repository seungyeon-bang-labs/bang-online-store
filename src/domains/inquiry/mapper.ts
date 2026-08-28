import { formatKoreanDate } from '@/shared/lib/format';
import type { StatusViewModel } from '@/shared/types/status';
import type { InquiryDTO, InquiryStatus } from './dto';
import {
  getInquiryActionEligibility,
  INQUIRY_STATUS_LABELS,
  INQUIRY_TYPE_FILTER_LABELS,
} from './domain';
import type {
  InquiryContextViewModel,
  InquiryViewModel,
} from './view-model';

const INQUIRY_STATUS_TONES: Record<InquiryStatus, StatusViewModel['tone']> = {
  pending: 'warning',
  answered: 'success',
  cancelled: 'neutral',
};

export function toInquiryViewModel(
  row: InquiryDTO,
  context: InquiryContextViewModel | null,
): InquiryViewModel {
  return {
    id: row.id,
    typeLabel: INQUIRY_TYPE_FILTER_LABELS[row.inquiry_type],
    title: row.title,
    content: row.content,
    context,
    status: {
      label: INQUIRY_STATUS_LABELS[row.status],
      tone: INQUIRY_STATUS_TONES[row.status],
    },
    actions: getInquiryActionEligibility(row.status),
    answerContent: row.answer_content,
    answeredAt: row.answered_at
      ? formatKoreanDate(row.answered_at)
      : null,
    createdAt: formatKoreanDate(row.created_at),
  };
}
