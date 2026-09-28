import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MAIN_CATEGORIES, SUB_CATEGORIES } from '@/shared/lib/navigation';
import { cn } from '@/shared/lib/utils';

interface CategoryPanelProps {
  className?: string;
}

export function CategoryPanel({ className }: CategoryPanelProps) {
  return (
    <>
      <div className={cn('space-y-4 bg-white md:hidden', className)}>
        {MAIN_CATEGORIES.map(category => {
          const subCategories = SUB_CATEGORIES.filter(
            subCategory => subCategory.parentId === category.id,
          );

          return (
            <section
              key={category.slug}
              className="rounded-xl border border-zinc-200 bg-white p-3"
              aria-labelledby={`mobile-category-${category.slug}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2
                  id={`mobile-category-${category.slug}`}
                  className="text-lg font-black tracking-tight text-black"
                >
                  {category.name}
                </h2>
                <Link
                  href={`/category/${category.slug}/all`}
                  className="-mr-2 inline-flex min-h-9 shrink-0 items-center gap-0.5 px-2 text-sm font-bold text-zinc-600"
                >
                  전체보기
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <ul className="grid grid-cols-4 gap-2">
                {subCategories.map(child => (
                  <li key={child.slug} className="min-w-0">
                    <Link
                      href={`/category/${category.slug}/${child.slug}`}
                      className="group flex min-w-0 flex-col items-center gap-1.5 rounded-lg border border-zinc-100 bg-white p-1.5 text-center"
                    >
                      <div className="relative aspect-square w-full">
                        <Image
                          src={child.imageUrl}
                          alt={child.altText}
                          fill
                          sizes="(max-width: 767px) 20vw, 160px"
                          className="object-contain"
                        />
                      </div>
                      <span className="w-full truncate text-xs font-semibold text-zinc-700">
                        {child.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div
        className={cn(
          'relative hidden grid-cols-1 items-start gap-5 bg-white px-5 pb-4 pt-2 sm:grid-cols-2 sm:px-6 md:grid md:grid-cols-4 md:gap-6 md:px-0 md:pb-5 md:pt-3',
          className,
        )}
      >
        {MAIN_CATEGORIES.map(category => {
          const subCategories = SUB_CATEGORIES.filter(
            subCategory => subCategory.parentId === category.id,
          );

          return (
            <div
              key={category.slug}
              className="overflow-hidden rounded-md border border-zinc-300 bg-white"
            >
              <Link
                href={`/category/${category.slug}/all`}
                className="group relative flex min-h-12 items-center justify-center bg-black px-4 py-3 text-white"
              >
                <span className="text-sm font-black tracking-tight transition-colors md:text-base">
                  {category.name}
                </span>
                <ChevronRight className="absolute right-4 size-5 -translate-x-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
              </Link>

              <ul className="divide-y divide-zinc-200 text-center">
                {subCategories.map(child => (
                  <li key={child.slug}>
                    <Link
                      href={`/category/${category.slug}/${child.slug}`}
                      className="group relative flex items-center justify-center px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black focus-visible:bg-zinc-100 focus-visible:text-black md:text-base dark:hover:text-white"
                    >
                      <span>{child.name}</span>
                      <ChevronRight className="absolute right-4 size-4 -translate-x-0.5 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}
