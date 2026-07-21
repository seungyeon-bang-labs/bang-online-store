import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { Slider } from '@/components/common/slider';
import { MAIN_CATEGORIES, SUB_CATEGORIES } from '@/lib/navigation';

export function CategoriesSlider() {
  const mainCategorySlugById = new Map(
    MAIN_CATEGORIES.map(category => [category.id, category.slug]),
  );

  const categories = [
    ...SUB_CATEGORIES,
    {
      slug: 'categories',
      name: '전체 카테고리',
      imageUrl: '',
      parentId: null,
      altText: '카테고리 아이콘',
    },
  ];

  return (
    <Slider rows={2} cols={8} gap="gap-2">
      {categories.map(sub => {
        const mainCategorySlug =
          sub.parentId !== null
            ? mainCategorySlugById.get(sub.parentId)
            : undefined;

        const href = sub.parentId
          ? mainCategorySlug
            ? `/category/${mainCategorySlug}/${sub.slug}`
            : '/categories'
          : `${sub.slug}`;

        return (
          <Link
            key={sub.slug}
            href={href}
            className="group flex flex-col items-center transition gap-2 p-2"
          >
            <div className="relative w-full aspect-square overflow-hidden bg-gray-100 rounded-lg">
              {sub.imageUrl ? (
                <Image
                  src={sub.imageUrl}
                  alt={sub.altText}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 12.5vw"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100 group-hover:scale-110">
                  <LayoutGrid className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-center truncate w-full group-hover:text-black transition">
              {sub.name}
            </span>
          </Link>
        );
      })}
    </Slider>
  );
}
