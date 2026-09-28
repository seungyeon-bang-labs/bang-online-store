'use client';

import { RotateCcw, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type FilterBadgeGroupProps = {
  activeFilters: { id: string; label: string }[];
  showReset?: boolean;
  isWrapped?: boolean;
  onRemove?: (id: string) => void;
};

export function FilterBadgeGroup({
  activeFilters,
  showReset = true,
  isWrapped,
  onRemove,
}: FilterBadgeGroupProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams(); // 추가

  const handleReset = () => {
    const currentSort = searchParams.get('sort'); // 1. 현재 sort 값을 가져옴
    const params = new URLSearchParams(); // 2. 빈 파라미터 객체 생성

    if (currentSort) {
      params.set('sort', currentSort); // 3. sort가 있었다면 다시 세팅
    }

    // 4. 결과: sort만 남거나, 아예 비어있는 쿼리 스트링으로 이동
    const queryString = params.toString();
    const targetPath = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(targetPath, { scroll: false });
  };

  return (
    <div
      className={cn(
        'flex gap-2 pb-1 transition-all',
        isWrapped === undefined &&
          'flex-nowrap overflow-x-auto scrollbar-hide md:flex-wrap md:overflow-visible',
        isWrapped === true && 'flex-wrap items-start',
        isWrapped === false &&
          'flex-nowrap items-center overflow-x-auto scrollbar-hide',
      )}
    >
      {/* 배지 리스트 */}
      <div
        className={cn(
          'flex gap-2',
          isWrapped === undefined && 'flex-nowrap md:flex-wrap',
          isWrapped === true && 'flex-wrap',
          isWrapped === false && 'flex-nowrap',
        )}
      >
        {/* 초기화 버튼 */}
        {showReset && activeFilters.length > 0 && (
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full bg-secondary shadow-sm shrink-0 min-w-28px h-28px w-28px"
            onClick={handleReset}
          >
            <RotateCcw strokeWidth={3} />
          </Button>
        )}
        {activeFilters.map(activeFilter => (
          <Badge
            variant="secondary"
            key={activeFilter.id}
            className="text-sm py-1 px-3 shadow-sm whitespace-nowrap flex items-center gap-1 border-none "
          >
            {activeFilter.label}
            <Button
              variant="ghost"
              size="icon-sm"
              className="flex items-center justify-center size-4"
              onClick={() => onRemove?.(activeFilter.id)}
            >
              <X strokeWidth={2} />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
