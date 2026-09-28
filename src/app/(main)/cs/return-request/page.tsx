import { PageTitle } from '@/shared/components/common/page-title';
import { CustomerServiceExchangeReturnGuide } from '@/features/customer-service/exchange-return-guide';

function ReturnRequestPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 md:py-10">
      <PageTitle
        parent={{ label: '고객센터', href: '/cs' }}
        current="교환·반품 안내"
        className="hidden md:flex"
      />

      <CustomerServiceExchangeReturnGuide />
    </div>
  );
}

export default ReturnRequestPage;
