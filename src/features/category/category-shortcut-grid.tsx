import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import type { CategoryGroupViewModel } from '@/domains/category';
import { createCategoryNavigationGroups } from './category-navigation';

interface CategoryShortcutGridProps {
  categoryGroupViewModels: readonly CategoryGroupViewModel[];
}

export function CategoryShortcutGrid({
  categoryGroupViewModels,
}: CategoryShortcutGridProps) {
  const categoryLinks = createCategoryNavigationGroups(categoryGroupViewModels);
  const categoryGridItems = categoryLinks.flatMap(
    category => category.subCategories,
  );
  const fullCategoryItem = {
    name: '전체',
    imageUrl: '',
    altText: '카테고리 아이콘',
    href: '/category',
  };

  return (
    <nav aria-label="상품 카테고리">
      <ul className="grid grid-cols-5 gap-x-2 gap-y-3 sm:grid-cols-6 md:grid-cols-7 md:gap-2 lg:grid-cols-8">
        {categoryGridItems.map(category => (
          <li key={category.slug}>
            <CategoryGridItem category={category} />
          </li>
        ))}
        <li>
          <CategoryFullPageGridItem category={fullCategoryItem} />
        </li>
      </ul>
    </nav>
  );
}

interface CategoryGridItemProps {
  category: {
    altText?: string;
    href: string;
    imageUrl?: string;
    name: string;
  };
}

const categoryGridItemClassName =
  'group flex min-w-0 flex-col items-center gap-1.5 text-center md:gap-2 md:p-2 md:transition';

function CategoryGridItem({ category }: CategoryGridItemProps) {
  return (
    <Link
      href={category.href}
      className={categoryGridItemClassName}
    >
      <CategoryGridItemContent category={category} />
    </Link>
  );
}

function CategoryFullPageGridItem({ category }: CategoryGridItemProps) {
  return (
    <>
      <a
        href={category.href}
        className={`${categoryGridItemClassName} md:hidden`}
      >
        <CategoryGridItemContent category={category} />
      </a>
      <Link
        href={category.href}
        className={`${categoryGridItemClassName} hidden md:flex`}
      >
        <CategoryGridItemContent category={category} />
      </Link>
    </>
  );
}

function CategoryGridItemContent({ category }: CategoryGridItemProps) {
  return (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.altText ?? `${category.name} 이미지`}
            fill
            sizes="(min-width: 1152px) 129px, (min-width: 1024px) calc(12.5vw - 0.9375rem), (min-width: 768px) calc(14.2857vw - 1rem), (min-width: 640px) calc(16.6667vw - 0.8333rem), calc(20vw - 0.9rem)"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
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
    </>
  );
}
