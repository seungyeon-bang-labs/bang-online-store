import { PageTitle } from '@/components/common/page-title';
import { CategoryPanel } from '@/features/category/category-panel';
import { Container } from '@/components/layout/container';

function CategoryFullPage() {
  return (
    <Container>
      <PageTitle current="CATEGORIES" className='mb-5' />
      <CategoryPanel />
    </Container>
  );
}

export default CategoryFullPage;
