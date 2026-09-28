import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { Slider } from '@/shared/components/common/slider';
import { MAIN_CATEGORIES, SUB_CATEGORIES } from '@/shared/lib/navigation';
import { MobileCategoryPageLink } from './mobile-category-page-link';

export function CategoriesSlider() {
  const mainCategorySlugById = new Map(
    MAIN_CATEGORIES.map(category => [category.id, category.slug]),
  );

  const categories = [
    ...SUB_CATEGORIES,
    {
      slug: 'category',
      name: '전체 카테고리',
      imageUrl: '',
      parentId: null,
      altText: '카테고리 아이콘',
    },
  ];

  const categoryLinks = categories.map(sub => {
    const mainCategorySlug =
      sub.parentId !== null
        ? mainCategorySlugById.get(sub.parentId)
        : undefined;
    const href = sub.parentId
      ? mainCategorySlug
        ? `/category/${mainCategorySlug}/${sub.slug}`
        : '/category'
      : `/${sub.slug}`;

    return { ...sub, href };
  });
  const mobileCategoryColumns = toMobileCategoryColumns(categoryLinks);

  return (
    <>
      <div className="md:hidden">
        <Slider
          showButtons={false}
          className="-mx-5 w-[calc(100%+2.5rem)]"
          contentClassName="ml-0 gap-2 pl-5"
          itemClassName="basis-[calc((100%-2.5rem)/5)] pl-0 last:mr-5"
          slidesToScroll={1}
          ariaLabel="상품 카테고리"
        >
          {mobileCategoryColumns.map((categories, index) => (
            <div key={index} className="grid grid-rows-2 gap-y-3">
              {categories.map(category => (
                <CategoryShortcut
                  key={category.slug}
                  category={category}
                  compact
                  nativeNavigation={category.href === '/category'}
                  label={category.slug === 'category' ? '전체' : undefined}
                />
              ))}
            </div>
          ))}
        </Slider>
      </div>
      <div className="hidden md:block">
        <Slider rows={2} cols={8} gap="gap-2">
          {categoryLinks.map(category => (
            <CategoryShortcut key={category.slug} category={category} />
          ))}
        </Slider>
      </div>
    </>
  );
}

function toMobileCategoryColumns<T>(categories: T[]): T[][] {
  const visibleColumnCount = 5;
  const firstPageSize = visibleColumnCount * 2;
  const firstPage = categories.slice(0, firstPageSize);
  const columns = Array.from({ length: visibleColumnCount }, (_, index) =>
    [firstPage[index], firstPage[index + visibleColumnCount]].filter(
      (category): category is T => category !== undefined,
    ),
  );

  for (let index = firstPageSize; index < categories.length; index += 2) {
    columns.push(categories.slice(index, index + 2));
  }

  return columns;
}

interface CategoryShortcutProps {
  category: {
    altText: string;
    href: string;
    imageUrl: string;
    name: string;
  };
  compact?: boolean;
  label?: string;
  nativeNavigation?: boolean;
}

function CategoryShortcut({
  category,
  compact = false,
  label = category.name,
  nativeNavigation = false,
}: CategoryShortcutProps) {
  const className = compact
    ? 'group flex min-w-0 flex-col items-center gap-1.5 text-center'
    : 'group flex flex-col items-center gap-2 p-2 transition';
  const content = (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        {category.imageUrl ? (
          <Image
            src={category.imageUrl}
            alt={category.altText}
            fill
            sizes="(max-width: 767px) 20vw, (max-width: 1024px) 25vw, 12.5vw"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-gray-100 group-hover:scale-110">
            <LayoutGrid className="size-6 text-gray-400 md:size-8" />
          </div>
        )}
      </div>
      <span className={compact
        ? 'line-clamp-2 min-h-4 w-full break-keep text-xs leading-4 font-medium text-black'
        : 'w-full truncate text-center text-sm font-medium transition group-hover:text-black'}
      >
        {label}
      </span>
    </>
  );

  if (nativeNavigation) {
    return (
      <MobileCategoryPageLink href={category.href} className={className}>
        {content}
      </MobileCategoryPageLink>
    );
  }

  return (
    <Link href={category.href} className={className}>
      {content}
    </Link>
  );
}
