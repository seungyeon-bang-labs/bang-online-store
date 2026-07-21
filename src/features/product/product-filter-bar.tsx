'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterSheet } from '@/features/product/filter-sheet';
import { SortDropdown } from '@/features/product/sort-dropdown';
import { FilterBadgeGroup } from '@/features/product/filter-badge-group';
import { FILTER_CONFIG } from '@/lib/filter-data';

type ProductFilterBarProps = {
  activeFilterValues: string[];
  currentSortValue?: string;
};

export function ProductFilterBar({
  activeFilterValues,
  currentSortValue,
}: ProductFilterBarProps) {
    const optionLabelMap = new Map<string, string>();
    FILTER_CONFIG.forEach(filter => {
      filter.options.forEach(option => {
        optionLabelMap.set(String(option.id), option.label);
      });
    });

    const activeFilterItems = activeFilterValues.map(id => ({
      id,
      label: optionLabelMap.get(id) ?? id,
    }));
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRemoveFilter = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const targetFilter = FILTER_CONFIG.find(filter =>
      filter.options.some(option => String(option.id) === id),
    );

    if (!targetFilter) return;

    const current = params.get(targetFilter.id)?.split(',') ?? [];
    const nextValues = current.filter(value => value !== id);

    if (nextValues.length === 0) {
      params.delete(targetFilter.id);
    } else {
      params.set(targetFilter.id, nextValues.join(','));
    }

    router.push(`?${params.toString()}`);
  };
  
  return (
    <div className="flex flex-col gap-4 mt-8 mb-4">
      <div className="flex items-center justify-between">
        <FilterSheet />
        <SortDropdown currentSortValue={currentSortValue} />
      </div>

      {activeFilterItems.length > 0 && (
        <FilterBadgeGroup
          activeFilters={activeFilterItems}
          onRemove={handleRemoveFilter}
        />
      )}
    </div>
  );
}
