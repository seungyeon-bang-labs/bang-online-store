import { SearchPanel } from '@/features/search/search-panel';
import { Container } from '@/shared/components/layout/container';
import { PageTitle } from '@/shared/components/common/page-title';

function SearchPage() {
  return (
    <Container className="mb-0 py-6 md:mb-20 md:py-10">
      <PageTitle current="SEARCH" className="hidden md:flex" />
      <SearchPanel />
    </Container>
  );
}

export default SearchPage;
