import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { MAIN_CATEGORIES, SUB_CATEGORIES } from '@/shared/lib/navigation';

export function CategoriesGrid() {
  const categoryGridItems = createCategoryGridItems(
    MAIN_CATEGORIES,
    SUB_CATEGORIES,
  );

  return (
    <nav aria-label="상품 카테고리">
      <ul className="grid grid-cols-5 gap-x-2 gap-y-3 sm:grid-cols-6 md:grid-cols-7 md:gap-2 lg:grid-cols-8">
        {categoryGridItems.map(category => (
          <li key={category.slug}>
            <CategoryGridItem category={category} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function createCategoryGridItems(
  mainCategories: typeof MAIN_CATEGORIES,
  subCategories: typeof SUB_CATEGORIES,
) {
  const mainCategorySlugById = new Map(
    mainCategories.map(category => [category.id, category.slug]),
  );

  const categories = [
    ...subCategories,
    {
      slug: 'category',
      name: '전체',
      imageUrl: '',
      parentId: null,
      altText: '카테고리 아이콘',
    },
  ];

  return categories.map(category => {
    const mainCategorySlug =
      category.parentId !== null
        ? mainCategorySlugById.get(category.parentId)
        : undefined;
    const href = category.parentId
      ? mainCategorySlug
        ? `/category/${mainCategorySlug}/${category.slug}`
        : '/category'
      : `/${category.slug}`;

    return { ...category, href };
  });
}

interface CategoryGridItemProps {
  category: {
    altText: string;
    href: string;
    imageUrl: string;
    name: string;
  };
}

function CategoryGridItem({ category }: CategoryGridItemProps) {
  return (
    <Link
      href={category.href}
      className="group flex min-w-0 flex-col items-center gap-1.5 text-center md:gap-2 md:p-2 md:transition"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.altText}
            fill
            sizes="(min-width: 1152px) 129px, (min-width: 1024px) calc(12.5vw - 0.9375rem), (min-width: 768px) calc(14.2857vw - 1rem), (min-width: 640px) calc(16.6667vw - 0.8333rem), calc(20vw - 0.9rem)"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
            loading="eager"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gray-100 group-hover:scale-110">
            <LayoutGrid className="size-6 text-gray-400 md:size-8" />
          </div>
        )}
      </div>
      <span className="line-clamp-2 min-h-4 w-full break-keep text-xs leading-4 font-medium text-black md:truncate md:text-base md:leading-normal md:transition md:group-hover:text-black">
        {category.name}
      </span>
    </Link>
  );
}
