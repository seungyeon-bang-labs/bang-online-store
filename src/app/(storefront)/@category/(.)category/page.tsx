import {
  categoryRepository,
  createCategoryGroups,
  toCategoryGroupViewModels,
} from '@/domains/category';
import { CategoryOverlay } from '@/features/category/category-overlay';

async function CategoryOverlayPage() {
  const categories = await categoryRepository.findMany();
  const categoryGroupViewModels = toCategoryGroupViewModels(
    createCategoryGroups(categories),
  );

  return <CategoryOverlay categoryGroupViewModels={categoryGroupViewModels} />;
}

export default CategoryOverlayPage;
