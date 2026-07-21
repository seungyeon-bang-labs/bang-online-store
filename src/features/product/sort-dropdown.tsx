'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { label: '인기순', value: 'popular' },
  { label: '신상품순', value: 'latest' },
  { label: '낮은 가격순', value: 'price_asc' },
  { label: '높은 가격순', value: 'price_desc' },
  { label: '할인율순', value: 'discount' },
] as const;

type SortDropdownProps = {
  currentSortValue?: (typeof SORT_OPTIONS)[number]['value'] | string;
};

export function SortDropdown({ currentSortValue }: SortDropdownProps) {
  const searchParams = useSearchParams();

  // 💡 기존 쿼리 스트링에 새로운 sort 값을 병합하는 함수
  const createSortLink = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value); // 기존에 sort가 있으면 덮어쓰고, 없으면 추가함
    return `?${params.toString()}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 font-black text-sm outline-none group cursor-pointer">
        <span className="tracking-tight">
          {SORT_OPTIONS.find(sort => sort.value === currentSortValue)?.label ||
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
        {SORT_OPTIONS.map(sort => (
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
