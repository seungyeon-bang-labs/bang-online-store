'use client';

import { Suspense } from 'react';
import { SearchInput } from '@/components/common/search-input';
import {
  POPULAR_SEARCH_KEYWORDS,
  RECENT_SEARCH_KEYWORDS,
} from '@/features/search/search.fixture';
import { PopularSearchList } from '@/features/search/popular-search-list';
import { RecentSearchList } from '@/features/search/recent-search-list';
import { cn } from '@/shared/lib/utils';

const sectionTitleClassName = 'text-sm font-black tracking-tight text-black';

interface SearchPanelProps {
  className?: string;
}

export function SearchPanel({ className }: SearchPanelProps) {
  return (
    <div
      className={cn(
        'w-full bg-white px-5 pb-4 pt-2 sm:px-6 md:px-0 md:pb-5 md:pt-3',
        className,
      )}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1.4fr_1fr] md:items-stretch">
        <section className="flex h-full flex-col">
          <Suspense fallback={<div className="h-12 w-full" />}>
            <SearchInput
              autoFocus
              className="relative w-full"
              inputClassName="border-zinc-300 hover:ring-[2px] hover:ring-black/70 has-[[data-slot=input-group-control]:focus-visible]:border-zinc-300 has-[[data-slot=input-group-control]:focus-visible]:ring-black/70"
              size="xl"
              getPageHref={({ q }) =>
                q ? `/search?q=${encodeURIComponent(q)}` : '/search'
              }
            />
          </Suspense>

          <RecentSearchList
            keywords={RECENT_SEARCH_KEYWORDS}
            titleClassName={sectionTitleClassName}
          />
        </section>

        <PopularSearchList
          keywords={POPULAR_SEARCH_KEYWORDS}
          titleClassName={sectionTitleClassName}
        />
      </div>
    </div>
  );
}
