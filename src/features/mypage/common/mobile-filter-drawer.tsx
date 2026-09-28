'use client';

import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/shared/components/ui/drawer';
import { getMypageFilterSelectionKey } from './filter-selection-key';

export interface MypageMobileFilterDrawerOption {
  value: string;
  label: string;
}

export interface MypageMobileFilterDrawerFilter {
  id: string;
  label: string;
  mobileSummaryLabel?: string;
  options: readonly MypageMobileFilterDrawerOption[];
}

export interface MypageMobileFilterDrawerToggle {
  id: string;
  label: string;
  visibleWhen?: {
    filterId: string;
    value: string;
  };
}

interface MypageMobileFilterDrawerProps {
  filters: readonly MypageMobileFilterDrawerFilter[];
  values: Readonly<Record<string, string>>;
  hrefBySelection: Readonly<Record<string, string>>;
  toggles?: readonly MypageMobileFilterDrawerToggle[];
}

export function MypageMobileFilterDrawer({
  filters,
  values,
  hrefBySelection,
  toggles = [],
}: MypageMobileFilterDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>(
    () => ({ ...values }),
  );
  const controlIds = useMemo(
    () => [...filters.map(filter => filter.id), ...toggles.map(toggle => toggle.id)],
    [filters, toggles],
  );

  const summary = [
    ...filters.flatMap(filter => {
      const option = filter.options.find(
        candidate => candidate.value === values[filter.id],
      );
      if (!option) return [];

      const summaryLabel = filter.mobileSummaryLabel ?? filter.label;
      return [
        summaryLabel ? `${summaryLabel} ${option.label}` : option.label,
      ];
    }),
    ...toggles.flatMap(toggle =>
      values[toggle.id] === 'true' ? [toggle.label] : [],
    ),
  ].join(' · ');

  function updateValue(id: string, value: string) {
    setSelectedValues(current => ({ ...current, [id]: value }));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSelectedValues({ ...values });
    }

    setOpen(nextOpen);
  }

  function isToggleVisible(toggle: MypageMobileFilterDrawerToggle): boolean {
    return !toggle.visibleWhen ||
      selectedValues[toggle.visibleWhen.filterId] === toggle.visibleWhen.value;
  }

  function applyFilters() {
    const href = hrefBySelection[
      getMypageFilterSelectionKey(controlIds, selectedValues)
    ];

    if (!href) return;

    setOpen(false);
    router.push(href);
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full justify-between border-zinc-300 bg-white px-3 shadow-none hover:border-zinc-400 hover:bg-zinc-100"
        >
          <span className="flex min-w-0 items-center gap-2">
            <SlidersHorizontal className="size-4 shrink-0" aria-hidden="true" />
            <span className="font-bold text-black">필터</span>
            <span className="min-w-0 truncate text-sm font-medium text-zinc-500">
              {summary}
            </span>
          </span>
          <ChevronDown className="size-4 shrink-0 text-zinc-500" aria-hidden="true" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[80dvh] rounded-t-md border-zinc-200 bg-white">
        <DrawerHeader className="border-b border-zinc-200 px-4 pb-4 text-left!">
          <DrawerTitle className="text-lg font-bold text-black">필터</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 py-5">
          <div className="space-y-6">
            {filters.map(filter => (
              <section key={filter.id} aria-labelledby={`mobile-filter-${filter.id}`}>
                <h3
                  id={`mobile-filter-${filter.id}`}
                  className="mb-3 text-sm font-bold text-black"
                >
                  {filter.label}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {filter.options.map(option => {
                    const isSelected = selectedValues[filter.id] === option.value;

                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateValue(filter.id, option.value)}
                        className="h-10 min-w-0 px-2 text-xs"
                      >
                        <span className="truncate">{option.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </section>
            ))}
            {toggles.map(toggle =>
              isToggleVisible(toggle) ? (
                <div key={toggle.id} className="flex items-start gap-2 border-t border-zinc-200 pt-5">
                  <Checkbox
                    id={`mobile-filter-${toggle.id}`}
                    checked={selectedValues[toggle.id] === 'true'}
                    onCheckedChange={checked =>
                      updateValue(toggle.id, checked ? 'true' : 'false')
                    }
                    className="mt-0.5 shrink-0 rounded-sm"
                  />
                  <label
                    htmlFor={`mobile-filter-${toggle.id}`}
                    className="cursor-pointer text-sm font-medium leading-5 text-zinc-700"
                  >
                    {toggle.label}
                  </label>
                </div>
              ) : null,
            )}
          </div>
        </div>
        <DrawerFooter className="border-t border-zinc-200 px-4 py-3">
          <Button type="button" className="h-11 w-full" onClick={applyFilters}>
            결과 보기
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
