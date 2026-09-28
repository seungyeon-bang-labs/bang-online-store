import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { cn } from '@/shared/lib/utils';

export interface CategorySibling {
  label: string;
  href: string;
}

interface CategorySwitcherProps {
  current: string;
  siblings: readonly CategorySibling[];
  variant?: 'page-title' | 'mobile-header';
}

export function CategorySwitcher({
  current,
  siblings,
  variant = 'page-title',
}: CategorySwitcherProps) {
  const isMobileHeader = variant === 'mobile-header';

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label={`${current} 상위 카테고리 선택`}
        className="group flex items-center gap-1 font-black tracking-tight outline-none"
      >
        <span
          className={cn(
            'whitespace-nowrap text-black',
            isMobileHeader && 'text-lg leading-6',
          )}
        >
          {current}
        </span>
        <ChevronDown
          size={isMobileHeader ? 22 : 28}
          strokeWidth={isMobileHeader ? 3 : 4}
          className="text-black transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={isMobileHeader ? 'center' : 'start'}
        sideOffset={isMobileHeader ? 8 : 15}
        className="min-w-(--radix-dropdown-menu-trigger-width) rounded-xl border-2 border-black bg-white p-1.5 shadow-none animate-in fade-in slide-in-from-top-2"
      >
        <div className="flex flex-col gap-1">
          {siblings.map(sibling => (
            <DropdownMenuItem
              key={sibling.href}
              asChild
              className="p-0 focus:bg-transparent"
            >
              <Link
                href={sibling.href}
                className={cn(
                  'w-full cursor-pointer rounded-lg px-4 py-2.5 text-center font-black tracking-tighter transition-all',
                  isMobileHeader ? 'text-base' : 'text-xl',
                  current === sibling.label
                    ? 'bg-black text-white data-highlighted:bg-black data-highlighted:text-white'
                    : 'bg-white text-black data-highlighted:bg-gray-200 data-highlighted:text-black',
                )}
              >
                {sibling.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
