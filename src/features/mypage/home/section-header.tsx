import Link from 'next/link';
import type { ReactNode } from 'react';

interface MypageHomeSectionHeaderProps {
  title: string;
  icon?: ReactNode;
  viewAllHref?: string;
}

export function MypageHomeSectionHeader({
  title,
  icon,
  viewAllHref,
}: MypageHomeSectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-zinc-200 pb-4">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-black tracking-tight text-black">
          {icon}
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="relative text-sm font-black text-zinc-500 underline-offset-4 after:absolute after:-inset-3 hover:text-black hover:underline"
        >
          전체 보기
        </Link>
      )}
    </div>
  );
}
