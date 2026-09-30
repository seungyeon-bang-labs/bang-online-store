import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import type { CategoryGroupViewModel } from '@/domains/category';
import { SectionHeader } from '@/shared/components/common/section-header';
import { cn } from '@/shared/lib/utils';
import {
  createCategoryNavigationGroups,
  type CategoryNavigationGroup,
} from './category-navigation';

interface CategoryPanelProps {
  categoryGroupViewModels: readonly CategoryGroupViewModel[];
  className?: string;
}

interface CategoryPresentationProps {
  categories: CategoryNavigationGroup[];
  className?: string;
}

export function CategoryPanel({
  categoryGroupViewModels,
  className,
}: CategoryPanelProps) {
  const categories = createCategoryNavigationGroups(categoryGroupViewModels);

  return (
    <>
      <MobileCategoryPanel categories={categories} className={className} />
      <DesktopCategoryPanel categories={categories} className={className} />
    </>
  );
}

function MobileCategoryPanel({
  categories,
  className,
}: CategoryPresentationProps) {
  return (
    <nav
      aria-label="상품 카테고리"
      className={cn('space-y-4 bg-white md:hidden', className)}
    >
      {categories.map(category => (
        <section
          key={category.slug}
          className="rounded-xl border border-zinc-200 bg-white p-3"
          aria-labelledby={`mobile-category-${category.slug}`}
        >
          <SectionHeader
            title={category.name}
            viewAllHref={category.href}
            titleId={`mobile-category-${category.slug}`}
            className="mb-3"
          />

          <ul className="grid grid-cols-3 gap-1 min-[480px]:grid-cols-4 sm:grid-cols-5">
            {category.subCategories.map(child => (
              <li key={child.slug} className="min-w-0">
                <Link
                  href={child.href}
                  className="flex min-w-0 flex-col items-center gap-1.5 rounded-md p-1.5 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <div className="relative aspect-square w-full">
                    {child.imageUrl ? (
                      <Image
                        src={child.imageUrl}
                        alt={child.altText ?? `${child.name} 이미지`}
                        fill
                        sizes="(min-width: 640px) 20vw, (min-width: 480px) 25vw, 33.333vw"
                        className="object-contain"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-zinc-300">
                        <LayoutGrid className="size-8" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <span className="w-full truncate text-xs font-semibold text-zinc-700">
                    {child.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

function DesktopCategoryPanel({
  categories,
  className,
}: CategoryPresentationProps) {
  return (
    <nav
      aria-label="상품 카테고리"
      className={cn(
        'hidden items-start bg-white md:grid md:grid-cols-4 md:gap-6 md:pb-5 md:pt-3',
        className,
      )}
    >
      {categories.map(category => (
        <section
          key={category.slug}
          className="overflow-hidden rounded-md border border-zinc-300 bg-white"
        >
          <h2>
            <Link
              href={category.href}
              className="group relative flex min-h-12 items-center justify-center bg-black px-4 py-3 text-white"
            >
              <span className="text-sm font-black tracking-tight md:text-base">
                {category.name}
              </span>
              <ChevronRight className="absolute right-4 size-5 -translate-x-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
            </Link>
          </h2>

          <ul className="divide-y divide-zinc-200 text-center">
            {category.subCategories.map(child => (
              <li key={child.slug}>
                <Link
                  href={child.href}
                  className="group relative flex items-center justify-center px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black focus-visible:bg-zinc-100 focus-visible:text-black md:text-base dark:hover:text-white"
                >
                  <span>{child.name}</span>
                  <ChevronRight className="absolute right-4 size-4 -translate-x-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}
