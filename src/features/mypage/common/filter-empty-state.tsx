import { ListFilter } from 'lucide-react';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';

interface MypageFilterEmptyStateProps {
  resetHref: string;
  className?: string;
}

export function MypageFilterEmptyState({
  resetHref,
  className,
}: MypageFilterEmptyStateProps) {
  return (
    <section
      className={cn(
        'flex min-h-72 flex-col items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 px-6 py-16 text-center',
        className,
      )}
    >
      <ListFilter className="size-8 text-zinc-400" aria-hidden="true" />
      <p className="mt-5 text-base font-black text-black">
        선택한 조건의 내역이 없습니다.
      </p>
      <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-zinc-500">
        필터를 초기화해 전체 내역을 확인해 보세요.
      </p>
      <ButtonLink
        href={resetHref}
        variant="outline"
        className="mt-6 rounded-sm border-zinc-300 bg-white font-bold shadow-none hover:border-black hover:bg-black hover:text-white"
      >
        필터 초기화
      </ButtonLink>
    </section>
  );
}
