import type {
  CategoryGroupViewModel,
  CategoryViewModel,
} from '@/domains/category';

export type CategoryNavigationItem = CategoryViewModel & {
  href: string;
};

export type CategoryNavigationGroup = Omit<CategoryGroupViewModel, 'subCategories'> & {
  href: string;
  subCategories: CategoryNavigationItem[];
};

export function createCategoryNavigationGroups(
  categoryGroupViewModels: readonly CategoryGroupViewModel[],
): CategoryNavigationGroup[] {
  return categoryGroupViewModels.map(categoryGroup => ({
    ...categoryGroup,
    href: `/category/${categoryGroup.slug}/all`,
    subCategories: categoryGroup.subCategories.map(subCategory => ({
      ...subCategory,
      href: `/category/${categoryGroup.slug}/${subCategory.slug}`,
    })),
  }));
}
