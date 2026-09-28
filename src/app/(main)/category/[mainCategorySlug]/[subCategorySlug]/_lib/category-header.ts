interface CategoryHeaderCategory {
  name: string;
  slug: string;
}

export function getCategoryHeader(
  categories: readonly CategoryHeaderCategory[],
  currentCategory: CategoryHeaderCategory,
) {
  return {
    current: currentCategory.name,
    siblings: categories.map(category => ({
      label: category.name,
      href: `/category/${category.slug}/all`,
    })),
  };
}

export function getCategoryEmptyNotice() {
  return {
    title: '상품이 없습니다.',
    description: '해당 카테고리에 준비된 상품이 없습니다.',
  };
}
