'use client';

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getMypageCurrentLabel,
  MYPAGE_HOME,
  MYPAGE_MENU_SECTIONS,
} from './mypage-menu';
import { MypageNavigationLink } from './mypage-navigation-link';

interface MobileMypageNavigationProps {
  pathname: string;
}

function MobileMypageNavigation({ pathname }: MobileMypageNavigationProps) {
  const currentLabel = getMypageCurrentLabel(pathname);

  return (
    <div className="md:hidden">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="group flex h-12 w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-4 text-sm font-black text-black outline-none transition-colors hover:border-black focus-visible:border-black">
          {currentLabel}
          <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          className="max-h-[calc(var(--radix-dropdown-menu-content-available-height)-4rem)] min-w-(--radix-dropdown-menu-trigger-width) border-zinc-200 bg-white p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-lg"
        >
          <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
            <MypageNavigationLink
              pathname={pathname}
              item={MYPAGE_HOME}
              variant="mobile"
            />
          </DropdownMenuItem>

          {MYPAGE_MENU_SECTIONS.map(section => (
            <div key={section.title}>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuLabel className="px-3 py-1 text-center text-xs font-black tracking-[0.08em] text-zinc-400">
                {section.title}
              </DropdownMenuLabel>
              {section.items.map(item => (
                <DropdownMenuItem
                  key={item.href}
                  asChild
                  className="p-0 focus:bg-transparent"
                >
                  <MypageNavigationLink
                    pathname={pathname}
                    item={item}
                    variant="mobile"
                  />
                </DropdownMenuItem>
              ))}
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default MobileMypageNavigation;
