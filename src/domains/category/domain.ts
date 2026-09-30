import type { CategoryDTO } from './dto';

export interface CategoryGroup {
  mainCategory: CategoryDTO;
  subCategories: CategoryDTO[];
}

export function createCategoryGroups(
  categories: readonly CategoryDTO[],
): CategoryGroup[] {
  const mainCategories = categories.filter(category => category.parent_id === null);
  const subCategories = categories.filter(category => category.parent_id !== null);

  return mainCategories.map(mainCategory => ({
    mainCategory,
    subCategories: subCategories.filter(
      subCategory => subCategory.parent_id === mainCategory.id,
    ),
  }));
}

export function findCategoryGroupBySlug(
  categoryGroups: readonly CategoryGroup[],
  mainCategorySlug: string,
) {
  return categoryGroups.find(
    categoryGroup => categoryGroup.mainCategory.slug === mainCategorySlug,
  );
}

export function hasSubCategorySlug(
  categoryGroup: CategoryGroup,
  subCategorySlug: string,
) {
  return (
    subCategorySlug === 'all' ||
    categoryGroup.subCategories.some(
      category => category.slug === subCategorySlug,
    )
  );
}
