'use client';

import { RotateCcw, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';
import type { ProductFilterSelectionViewModel } from '@/domains/product';

type FilterBadgeGroupProps = {
  activeFilters: readonly ProductFilterSelectionViewModel[];
  showReset?: boolean;
  isWrapped?: boolean;
  onRemove?: (selection: ProductFilterSelectionViewModel) => void;
  onReset?: () => void;
};

export function FilterBadgeGroup({
  activeFilters,
  showReset = true,
  isWrapped,
  onRemove,
  onReset,
}: FilterBadgeGroupProps) {
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
        {showReset && activeFilters.length > 0 && onReset && (
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-full bg-secondary shadow-sm shrink-0 min-w-28px h-28px w-28px"
            onClick={onReset}
            aria-label="선택한 필터 초기화"
          >
            <RotateCcw strokeWidth={3} />
          </Button>
        )}
        {activeFilters.map(activeFilter => (
          <Badge
            variant="secondary"
            key={`${activeFilter.filterId}:${activeFilter.value}`}
            className="text-sm py-1 px-3 shadow-sm whitespace-nowrap flex items-center gap-1 border-none "
          >
            {activeFilter.label}
            <Button
              variant="ghost"
              size="icon-sm"
              className="flex items-center justify-center size-4"
              onClick={() => onRemove?.(activeFilter)}
              aria-label={`${activeFilter.label} 필터 제거`}
            >
              <X strokeWidth={2} />
            </Button>
          </Badge>
        ))}
      </div>
    </div>
  );
}
