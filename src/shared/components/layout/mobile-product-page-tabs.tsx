'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { ButtonLink } from '@/shared/components/ui/button';
import { BEST_TABS, NEW_TABS } from '@/shared/lib/navigation';
import { cn } from '@/shared/lib/utils';

const tabConfigs = {
  '/new': {
    ariaLabel: 'NEW 기간 선택',
    defaultTab: 'now',
    layout: 'scroll',
    tabs: NEW_TABS,
  },
  '/best': {
    ariaLabel: 'BEST 기간 선택',
    defaultTab: 'daily',
    layout: 'fill',
    tabs: BEST_TABS,
  },
} as const;

export function MobileProductPageTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const config = tabConfigs[pathname as keyof typeof tabConfigs];

  if (!config) return null;

  const currentTab = searchParams.get('period') ?? config.defaultTab;

  return (
    <nav
      aria-label={config.ariaLabel}
      className={cn(
        'flex h-14 items-center gap-2 border-t border-gray-200 px-5 md:hidden',
        config.layout === 'fill'
          ? 'bg-white'
          : 'overflow-x-auto bg-gray-50',
      )}
    >
      {config.tabs.map(tab => {
        const isActive = tab.urlQuery === currentTab;

        return (
          <ButtonLink
            key={tab.urlQuery}
            href={`?period=${tab.urlQuery}`}
            scroll={false}
            size={config.layout === 'fill' ? 'sm' : 'lg'}
            variant="outline"
            className={cn(
              config.layout === 'fill' && 'min-w-0 flex-1 px-2',
              isActive
                ? 'bg-black text-white hover:bg-black hover:text-white'
                : 'bg-white text-black',
            )}
          >
            {tab.label}
          </ButtonLink>
        );
      })}
    </nav>
  );
}
