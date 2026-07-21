import Link from 'next/link';
import { toRankChangeView } from '@/features/search/search.mapper';
import { PopularSearchKeyword } from '@/features/search/search.types';
import { cn } from '@/shared/lib/utils';

interface PopularSearchListProps {
  keywords: PopularSearchKeyword[];
  titleClassName: string;
}

export function PopularSearchList({
  keywords,
  titleClassName,
}: PopularSearchListProps) {
  return (
    <section className="h-full rounded-md border border-zinc-300 bg-white p-4 transition-shadow hover:ring-2 hover:ring-black/70">
      <p className={titleClassName}>인기 검색어</p>
      <div className="mt-3 grid grid-cols-1 gap-1 md:grid-cols-2 md:gap-x-3">
        {keywords.map(({ keyword, rankChange }, index) => {
          const rankChangeView = toRankChangeView(rankChange);

          return (
            <Link
              key={keyword}
              href={`/search?q=${encodeURIComponent(keyword)}`}
              className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black focus-visible:bg-zinc-100 focus-visible:text-black"
            >
              <span className="w-5 text-xs font-black text-black">
                {index + 1}
              </span>
              <span>{keyword}</span>
              <span
                className={cn(
                  'ml-auto w-9 text-center text-xs font-black',
                  rankChangeView.className,
                )}
              >
                {rankChangeView.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
