import type { InquiryViewModel } from '@/domains/inquiry';
import { MypageInquiryCard } from './card';

interface MypageInquiryListProps {
  inquiries: readonly InquiryViewModel[];
  returnHref: string;
  cancelInquiryAction: (inquiryId: string) => Promise<boolean>;
}

export function MypageInquiryList({
  inquiries,
  returnHref,
  cancelInquiryAction,
}: MypageInquiryListProps) {
  return (
    <div className="space-y-4">
      {inquiries.map(inquiry => (
        <MypageInquiryCard
          key={inquiry.id}
          inquiry={inquiry}
          returnHref={returnHref}
          cancelInquiryAction={cancelInquiryAction}
        />
      ))}
    </div>
  );
}
