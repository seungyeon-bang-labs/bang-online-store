'use client';

import { usePathname } from 'next/navigation';
import { Button, ButtonLink } from '@/shared/components/ui/button';
import { filterMenuByAuth, MOBILE_FOOTER_MENU } from '@/shared/lib/navigation';

interface MobileBottomNavProps {
  isLoggedIn: boolean;
}

export function MobileBottomNav({ isLoggedIn }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-(--mobile-bottom-nav-height) border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto w-full max-w-6xl px-3 py-2">
        <div className="flex items-center justify-around">
          {filterMenuByAuth(MOBILE_FOOTER_MENU, isLoggedIn).map(item => {
            const isActive =
              item.href === '/'
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isFullPageNavigation =
              item.href === '/category' || item.href === '/search';
            const className = `flex min-h-12 min-w-12 flex-col items-center gap-1 rounded-xl px-3 py-1 ${
              isActive ? 'text-black' : 'text-zinc-500'
            }`;
            const content = (
              <>
                {item.icon ? (
                  <item.icon
                    className="size-6"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                ) : null}
                <span
                  className={`text-[10px] tracking-wide ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.mobileLabel ?? item.name}
                </span>
              </>
            );

            if (isFullPageNavigation) {
              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  size="icon"
                  className={className}
                >
                  <a href={item.href} aria-current={isActive ? 'page' : undefined}>
                    {content}
                  </a>
                </Button>
              );
            }

            return (
              <ButtonLink
                key={item.href}
                variant="ghost"
                href={item.href}
                size="icon"
                aria-current={isActive ? 'page' : undefined}
                className={className}
              >
                {content}
              </ButtonLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
