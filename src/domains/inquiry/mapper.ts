import { formatKoreanDateTime } from '@/shared/lib/format';
import type { StatusViewModel } from '@/shared/types/status';
import type {
  InquiryDTO,
  InquiryStatus,
  InquiryType,
} from './dto';
import type { InquiryViewModel } from './view-model';

const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  order: '주문/결제',
  delivery: '배송',
  return: '교환/반품',
  product: '상품',
  coupon: '쿠폰/이벤트',
  account: '회원/계정',
  etc: '기타',
};

const INQUIRY_STATUS_VIEW: Record<InquiryStatus, StatusViewModel> = {
  pending: { label: '답변대기', tone: 'warning' },
  answered: { label: '답변완료', tone: 'success' },
};

export function toInquiryViewModel(row: InquiryDTO): InquiryViewModel {
  return {
    id: row.id,
    typeLabel: INQUIRY_TYPE_LABEL[row.inquiry_type],
    title: row.title,
    content: row.content,
    status: INQUIRY_STATUS_VIEW[row.status],
    answerContent: row.answer_content,
    answeredAt: row.answered_at
      ? formatKoreanDateTime(row.answered_at)
      : null,
    createdAt: formatKoreanDateTime(row.created_at),
  };
}
