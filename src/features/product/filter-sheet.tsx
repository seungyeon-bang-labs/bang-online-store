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
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { FILTER_CONFIG, ColorOption, FilterId } from '@/lib/filter-data';
import { FilterBadgeGroup } from '@/features/product/filter-badge-group';
import { ColorChip } from '@/components/ui/color-chip';

type SelectedFilters = Record<FilterId, string[]>;
type FilterBadgeItem = { id: string; label: string };

export function FilterSheet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const optionLabelMap = new Map<string, string>();
  FILTER_CONFIG.forEach(filter => {
    filter.options.forEach(option => {
      const id = String(option.id);
      optionLabelMap.set(id, option.label);
    });
  });

  const readSelectedFromUrl = () => {
    const initialState: SelectedFilters = {
      size: [],
      price: [],
      discount: [],
      color: [],
    };
    searchParams.forEach((value, key) => {
      if (key in initialState) {
        initialState[key as FilterId] = value.split(',');
      }
    });
    return initialState;
  };

  // 1. URL에서 초기 상태 읽어오기
  const [selected, setSelected] =
    useState<SelectedFilters>(readSelectedFromUrl);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelected(readSelectedFromUrl());
    }
    setOpen(nextOpen);
  };

  // 2. 필터 클릭 핸들러
  const handleSelect = (id: FilterId, value: string, isMultiple: boolean) => {
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

  // 3. 적용하기 (기존 쿼리 유지하며 필터만 업데이트)
  const handleApply = () => {
    // 1. 현재 URL의 모든 쿼리 파라미터를 가져옵니다. (sort 등 포함)
    const params = new URLSearchParams(searchParams.toString());

    // 2. 필터에 해당하는 키들(size, price, discount, color)을 먼저 제거합니다.
    // 이렇게 해야 기존에 선택됐다가 취소된 필터가 URL에서 사라집니다.
    const filterKeys: FilterId[] = ['size', 'price', 'discount', 'color'];
    filterKeys.forEach(key => params.delete(key));

    // 3. 현재 state(selected)에 담긴 새로운 필터 값들을 추가합니다.
    Object.entries(selected).forEach(([key, values]) => {
      if (values.length > 0) {
        params.set(key, values.join(','));
      }
    });

    // 4. 생성된 쿼리 스트링으로 이동 (sort는 params에 그대로 남아있음)
    router.push(`?${params.toString()}`);
    setOpen(false);
  };

  // 4. 초기화
  const handleReset = () => {
    setSelected({ size: [], price: [], discount: [], color: [] });
  };

  const handleRemoveFilter = (id: string) => {
    const targetFilter = FILTER_CONFIG.find(filter =>
      filter.options.some(option => String(option.id) === id),
    );

    if (!targetFilter) return;

    setSelected(prev => ({
      ...prev,
      [targetFilter.id]: prev[targetFilter.id].filter(v => v !== id),
    }));
  };

  const activeFilterItems: FilterBadgeItem[] = Object.values(selected)
    .flat()
    .map(id => ({ id, label: optionLabelMap.get(id) ?? id }));

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <div className="flex items-center gap-1 font-black text-sm cursor-pointer">
          <SlidersHorizontal size={16} strokeWidth={3} />
          <span>필터</span>
        </div>
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
          {FILTER_CONFIG.map(filter => (
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
                    {(filter.options as ColorOption[]).map(option => {
                      const optionId = String(option.id);
                      const isSelected = selected[filter.id].includes(optionId);

                      return (
                        <ColorChip
                          key={option.id}
                          label={option.label}
                          hex={option.colorCode}
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
              onRemove={handleRemoveFilter}
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
