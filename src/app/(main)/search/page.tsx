import { SearchPanel } from '@/features/search/search-panel';
import { Container } from '@/components/layout/container';
import { PageTitle } from '@/components/common/page-title';

function SearchPage() {
  return (
    <Container>
      <PageTitle current="SEARCH" />
      <SearchPanel />
    </Container>
  );
}

export default SearchPage;
