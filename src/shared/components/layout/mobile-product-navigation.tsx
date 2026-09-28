'use client';

import { useEffect, useRef } from 'react';
import { ButtonLink } from '@/shared/components/ui/button';
import { MOBILE_PRODUCT_MENU } from '@/shared/lib/navigation';
import { cn } from '@/shared/lib/utils';

interface MobileProductNavigationProps {
  activeHref: string;
}

export function MobileProductNavigation({
  activeHref,
}: MobileProductNavigationProps) {
  const activeItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(max-width: 767px)').matches) return;

    activeItemRef.current?.scrollIntoView({
      block: 'nearest',
      inline: 'center',
    });
  }, [activeHref]);

  return (
    <nav
      aria-label="상품 바로가기"
      className="flex h-14 w-full items-center gap-2 overflow-x-auto border-t border-gray-200 bg-white px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
    >
      {MOBILE_PRODUCT_MENU.map(item => {
        const isActive = item.href === activeHref;

        return (
          <ButtonLink
            key={item.href}
            href={item.href}
            ref={isActive ? activeItemRef : undefined}
            variant="outline"
            size="sm"
            className={cn(
              'shrink-0 rounded-full px-3 text-xs font-bold',
              isActive
                ? 'border-black bg-black text-white hover:bg-black hover:text-white'
                : 'border-gray-200',
            )}
          >
            {item.name}
          </ButtonLink>
        );
      })}
    </nav>
  );
}
