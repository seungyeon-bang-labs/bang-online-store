import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

interface SectionHeaderProps {
  title: string;
  viewAllHref?: string;
  titleId?: string;
  className?: string;
}

export function SectionHeader({
  title,
  viewAllHref,
  titleId,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2
        id={titleId}
        className="text-lg leading-6 font-bold tracking-tight text-black md:text-xl md:leading-7 md:font-black"
      >
        {title}
      </h2>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="relative text-sm font-black text-zinc-500 underline-offset-4 after:absolute after:-inset-3 hover:text-black hover:underline focus-visible:text-black focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
        >
          전체 보기
        </Link>
      )}
    </div>
  );
}
