export interface CategoryViewModel {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  imageUrl?: string;
  altText?: string;
}

export interface CategoryGroupViewModel extends CategoryViewModel {
  parentId: null;
  subCategories: CategoryViewModel[];
}
