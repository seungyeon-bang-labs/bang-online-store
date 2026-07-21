import Link from 'next/link';
import { X } from 'lucide-react';

interface RecentSearchListProps {
  keywords: string[];
  titleClassName: string;
}

export function RecentSearchList({
  keywords,
  titleClassName,
}: RecentSearchListProps) {
  return (
    <div className="mt-4 flex flex-1 flex-col rounded-md border border-zinc-300 bg-white p-4 transition-shadow hover:ring-2 hover:ring-black/70">
      <div>
        <p className={titleClassName}>최근 검색어</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {keywords.map(keyword => (
            <Link
              key={keyword}
              href={`/search?q=${encodeURIComponent(keyword)}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 hover:text-black focus-visible:bg-zinc-200 focus-visible:text-black"
            >
              <span>{keyword}</span>
              <X className="size-3.5 text-zinc-400" aria-hidden />
            </Link>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="ml-auto mt-auto pt-4 text-right text-xs font-semibold text-zinc-500 transition-colors hover:text-black focus-visible:text-black"
      >
        전체 삭제
      </button>
    </div>
  );
}
