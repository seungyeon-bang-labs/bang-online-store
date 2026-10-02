'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  PRODUCT_SORT_OPTIONS,
  type ProductSortOption,
} from '@/domains/product';

type SortDropdownProps = {
  currentSortValue: ProductSortOption;
};

export function SortDropdown({ currentSortValue }: SortDropdownProps) {
  const searchParams = useSearchParams();

  // 💡 기존 쿼리 스트링에 새로운 sort 값을 병합하는 함수
  const createSortLink = (value: ProductSortOption) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value); // 기존에 sort가 있으면 덮어쓰고, 없으면 추가함
    return `?${params.toString()}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group inline-flex min-h-10 items-center gap-1 px-1 text-sm font-black outline-none">
        <span className="tracking-tight">
          {PRODUCT_SORT_OPTIONS.find(sort => sort.value === currentSortValue)?.label ||
            '인기순'}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={3}
          className="transition-transform group-data-[state=open]:rotate-180"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-140px border-2 border-black rounded-md p-1 shadow-none bg-white gap-1 flex flex-col"
      >
        {PRODUCT_SORT_OPTIONS.map(sort => (
          <DropdownMenuItem
            key={sort.value}
            asChild
            className="p-0 focus:bg-transparent"
          >
            <Link
              href={createSortLink(sort.value)}
              className={cn(
                'w-full cursor-pointer px-4 py-2.5 rounded-lg transition-all text-center',
                'text-sm font-black tracking-tighter ',
                currentSortValue === sort.value
                  ? 'bg-black text-white data-highlighted:bg-black data-highlighted:text-white'
                  : 'bg-white text-black data-highlighted:bg-gray-200 data-highlighted:text-black',
              )}
            >
              {sort.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
