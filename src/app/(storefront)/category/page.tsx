import { PageTitle } from '@/shared/components/common/page-title';
import { CategoryPanel } from '@/features/category/category-panel';
import { Container } from '@/shared/components/layout/container';

function CategoryFullPage() {
  return (
    <Container className="mb-0 py-6 pb-0 pt-4 md:mb-20 md:py-10 md:pb-10 md:pt-10">
      <PageTitle current="카테고리" className="mb-5 hidden md:flex" />
      <CategoryPanel />
    </Container>
  );
}

export default CategoryFullPage;
