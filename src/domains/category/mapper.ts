import type { CategoryDTO } from './dto';
import type { CategoryGroup } from './domain';
import type {
  CategoryGroupViewModel,
  CategoryViewModel,
} from './view-model';

export function toCategoryViewModel(dto: CategoryDTO): CategoryViewModel {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    parentId: dto.parent_id,
    imageUrl: dto.image_url ?? undefined,
    altText: dto.alt_text ?? undefined,
  };
}

export function toCategoryGroupViewModel(
  categoryGroup: CategoryGroup,
): CategoryGroupViewModel {
  const mainCategory = toCategoryViewModel(categoryGroup.mainCategory);

  return {
    ...mainCategory,
    parentId: null,
    subCategories: categoryGroup.subCategories.map(toCategoryViewModel),
  };
}

export function toCategoryGroupViewModels(
  categoryGroups: readonly CategoryGroup[],
): CategoryGroupViewModel[] {
  return categoryGroups.map(toCategoryGroupViewModel);
}
