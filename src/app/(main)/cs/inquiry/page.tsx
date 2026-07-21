import { PageTitle } from '@/components/common/page-title';
import { InquiryForm } from '@/features/customer-service/inquiry-form';
import { InquiryGuide } from '@/features/customer-service/inquiry-guide';

function InquiryPage() {
  return (
    <div className="w-full max-w-6xl p-8 md:py-10">
      <PageTitle
        parent={{ label: '고객센터', href: '/cs' }}
        current="1:1 문의 작성"
        className="mb-6"
      />

      <InquiryForm />
      <InquiryGuide />
    </div>
  );
}

export default InquiryPage;
