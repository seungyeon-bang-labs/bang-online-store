'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { FilterBadgeGroup } from '@/features/product/filter-badge-group';
import { ColorChip } from '@/shared/components/ui/color-chip';
import {
  toProductFilterSelectionViewModels,
  type ProductFilterCriteria,
  type ProductFilterId,
  type ProductFilterViewModel,
} from '@/domains/product';

type SelectedFilters = Record<ProductFilterId, string[]>;

type FilterSheetProps = {
  productFilterViewModel: ProductFilterViewModel;
  productFilterCriteria: ProductFilterCriteria;
};

function createSelectedFilters(
  productFilterCriteria: ProductFilterCriteria,
): SelectedFilters {
  return {
    size: [...productFilterCriteria.sizes],
    price: productFilterCriteria.priceRangeId
      ? [productFilterCriteria.priceRangeId]
      : [],
    discount: productFilterCriteria.discountRateId
      ? [productFilterCriteria.discountRateId]
      : [],
    color: productFilterCriteria.colorIds.map(String),
  };
}

export function FilterSheet({
  productFilterViewModel,
  productFilterCriteria,
}: FilterSheetProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [selected, setSelected] =
    useState<SelectedFilters>(() =>
      createSelectedFilters(productFilterCriteria),
    );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelected(createSelectedFilters(productFilterCriteria));
    }
    setOpen(nextOpen);
  };

  const handleSelect = (
    id: ProductFilterId,
    value: string,
    isMultiple: boolean,
  ) => {
    setSelected(prev => {
      const current = prev[id];
      if (isMultiple) {
        return {
          ...prev,
          [id]: current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value],
        };
      } else {
        return { ...prev, [id]: current.includes(value) ? [] : [value] };
      }
    });
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    productFilterViewModel.sections.forEach(section => params.delete(section.id));

    Object.entries(selected).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(','));
      }
    });

    router.push(`?${params.toString()}`);
    setOpen(false);
  };

  const handleReset = () => {
    setSelected({ size: [], price: [], discount: [], color: [] });
  };

  const handleRemoveFilter = (filterId: ProductFilterId, value: string) => {
    setSelected(prev => ({
      ...prev,
      [filterId]: prev[filterId].filter(item => item !== value),
    }));
  };

  const activeFilterItems = toProductFilterSelectionViewModels(
    {
      sizes: selected.size,
      colorIds: selected.color.map(Number).filter(Number.isSafeInteger),
      priceRangeId: selected.price[0] ?? null,
      discountRateId: selected.discount[0] ?? null,
      sort: productFilterCriteria.sort,
    },
    productFilterViewModel,
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-1 px-1 text-sm font-black cursor-pointer"
        >
          <SlidersHorizontal size={16} strokeWidth={3} />
          <span>필터</span>
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[85vw] sm:w-95 border-l-2 border-gray-200 bg-white flex flex-col h-full gap-0"
      >
        <SheetHeader className="p-6 border-b-2 border-gray-200 shrink-0">
          <SheetTitle className="text-xl font-black tracking-tight">
            필터
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-10 scrollbar-hide">
          {productFilterViewModel.sections.map(filter => (
            <div key={filter.id}>
              <h4 className="font-black text-base mb-4 flex items-center gap-2">
                {filter.label}
                {filter.isMultiple && (
                  <span className="text-[11px] text-gray-400 font-medium">
                    중복 선택 가능
                  </span>
                )}
              </h4>
              <div className="pl-2">
                {filter.type === 'button' && (
                  <div className="grid grid-cols-3 gap-2">
                    {filter.options.map(option => (
                      <Button
                        variant="outline"
                        key={option.id}
                        className={cn(
                          'text-sm font-bold',
                          selected[filter.id].includes(String(option.id))
                            ? 'bg-black text-white hover:bg-black hover:text-white'
                            : 'bg-white text-black',
                        )}
                        onClick={() =>
                          handleSelect(
                            filter.id,
                            String(option.id),
                            !!filter.isMultiple,
                          )
                        }
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                )}
                {filter.type === 'checkbox' && (
                  <div className="flex flex-col gap-5">
                    {filter.options.map(option => {
                      const optionId = String(option.id);
                      const id = `filter-${filter.id}-${optionId}`;

                      const isSelected = selected[filter.id].includes(optionId);

                      return (
                        <div
                          key={option.id}
                          className="flex items-center space-x-3 group cursor-pointer"
                        >
                          <Checkbox
                            id={id}
                            className="w-5 h-5 border-2 border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black transition-colors"
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleSelect(
                                filter.id,
                                optionId,
                                !!filter.isMultiple,
                              )
                            }
                          />
                          <label
                            htmlFor={id}
                            className="text-sm font-bold leading-none cursor-pointer group-hover:text-gray-600 transition-colors"
                          >
                            {option.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
                {filter.type === 'color' && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-y-6 gap-x-2">
                    {filter.options.map(option => {
                      const optionId = String(option.id);
                      const isSelected = selected[filter.id].includes(optionId);

                      if (!option.hex) return null;

                      return (
                        <ColorChip
                          key={option.id}
                          label={option.label}
                          hex={option.hex}
                          isSelected={isSelected}
                          onClick={() =>
                            handleSelect(
                              filter.id,
                              optionId,
                              !!filter.isMultiple,
                            )
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t-2 border-gray-200 flex flex-col gap-4 bg-white shrink-0">
          {Object.values(selected).flat().length > 0 && (
            <FilterBadgeGroup
              activeFilters={activeFilterItems}
              showReset={false}
              isWrapped={true}
              onRemove={selection =>
                handleRemoveFilter(selection.filterId, selection.value)
              }
            />
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xl"
              className="flex-1 font-bold"
              onClick={handleReset}
            >
              초기화
            </Button>
            <Button
              size="xl"
              className="flex-2 font-bold"
              onClick={handleApply}
            >
              적용하기
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
