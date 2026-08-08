import type { InquiryViewModel } from '@/domains/inquiry';
import { MypageInquiryCard } from './card';

interface MypageInquiryListProps {
  inquiries: readonly InquiryViewModel[];
}

export function MypageInquiryList({ inquiries }: MypageInquiryListProps) {
  return (
    <div className="space-y-4">
      {inquiries.map(inquiry => (
        <MypageInquiryCard key={inquiry.id} inquiry={inquiry} />
      ))}
    </div>
  );
}
