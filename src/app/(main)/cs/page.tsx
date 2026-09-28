import { PageTitle } from '@/shared/components/common/page-title';
import { NoticeAndFAQPreview } from '@/features/customer-service/notice-and-faq-preview';
import { QuickInfo } from '@/features/customer-service/quick-info';
import { Container } from '@/shared/components/layout/container';
import { QuickMenu } from '@/features/customer-service/quick-menu';

const CSPage = () => {
  return (
    <Container>
      <PageTitle current="고객센터" className="mb-6 hidden md:flex" />

      <QuickMenu />

      <NoticeAndFAQPreview />

      <QuickInfo />
    </Container>
  );
};

export default CSPage;
