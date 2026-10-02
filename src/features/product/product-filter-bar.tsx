'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FilterSheet } from '@/features/product/filter-sheet';
import { SortDropdown } from '@/features/product/sort-dropdown';
import { FilterBadgeGroup } from '@/features/product/filter-badge-group';
import type {
  ProductFilterCriteria,
  ProductFilterSelectionViewModel,
  ProductFilterViewModel,
} from '@/domains/product';

type ProductFilterBarProps = {
  productFilterViewModel: ProductFilterViewModel;
  productFilterCriteria: ProductFilterCriteria;
  productFilterSelectionViewModels: readonly ProductFilterSelectionViewModel[];
};

export function ProductFilterBar({
  productFilterViewModel,
  productFilterCriteria,
  productFilterSelectionViewModels,
}: ProductFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const navigateWithParams = (params: URLSearchParams) => {
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const getSelectedValues = (
    filterId: ProductFilterSelectionViewModel['filterId'],
  ) => {
    switch (filterId) {
      case 'size':
        return productFilterCriteria.sizes;
      case 'color':
        return productFilterCriteria.colorIds.map(String);
      case 'price':
        return productFilterCriteria.priceRangeId
          ? [productFilterCriteria.priceRangeId]
          : [];
      case 'discount':
        return productFilterCriteria.discountRateId
          ? [productFilterCriteria.discountRateId]
          : [];
    }
  };

  const handleRemoveFilter = (
    selection: ProductFilterSelectionViewModel,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextValues = getSelectedValues(selection.filterId).filter(
      value => value !== selection.value,
    );

    params.delete(selection.filterId);
    if (nextValues.length === 0) {
      navigateWithParams(params);
    } else {
      params.set(selection.filterId, nextValues.join(','));
      navigateWithParams(params);
    }
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    productFilterViewModel.sections.forEach(section =>
      params.delete(section.id),
    );
    navigateWithParams(params);
  };

  return (
    <div className="mt-6 mb-4 flex flex-col gap-4 md:mt-8">
      <div className="flex items-center justify-between">
        <FilterSheet
          productFilterViewModel={productFilterViewModel}
          productFilterCriteria={productFilterCriteria}
        />
        <SortDropdown currentSortValue={productFilterCriteria.sort} />
      </div>

      {productFilterSelectionViewModels.length > 0 && (
        <FilterBadgeGroup
          activeFilters={productFilterSelectionViewModels}
          onRemove={handleRemoveFilter}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
