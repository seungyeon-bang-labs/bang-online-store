'use client';

import Link from 'next/link';
import { Button, ButtonLink } from '@/components/ui/button';
import { Search, Menu, X } from 'lucide-react';
import { LogoWithIcon } from '@/components/layout/logo';
import {
  filterMenuByAuth,
  PC_UTILITY_MENU,
  PC_MAIN_MENU,
} from '@/lib/navigation';
import { useCloseOverlayRoute } from '@/shared/hooks/use-close-overlay-route';
import { useOverlayRoute } from '@/components/layout/overlay-route-context';

export function Header() {
  const isLoggedIn = true;
  const closeOverlayRoute = useCloseOverlayRoute();
  const { activeOverlayRoute } = useOverlayRoute();

  const isOverlayOpen = activeOverlayRoute !== null;

  return (
    <>
      <div className="max-w-6xl w-full items-center justify-between  px-8 py-2 pb-4 hidden md:flex">
        <div className="flex items-end gap-8 w-full justify-between">
          <Link href="/" className="hover:scale-105">
            <LogoWithIcon />
          </Link>
          <div className="flex w-full items-center justify-center flex-col">
            <div className="flex items-center justify-end gap-2 w-full">
              {filterMenuByAuth(PC_UTILITY_MENU, isLoggedIn).map(item => (
                <ButtonLink
                  key={item.href}
                  href={item.href}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500 hover:text-black"
                >
                  {item.name}
                </ButtonLink>
              ))}
            </div>
            <div className="flex items-center justify-center w-full">
              <nav className="flex items-center gap-2">
                {PC_MAIN_MENU.map(item => (
                  <ButtonLink
                    key={item.href}
                    href={item.href}
                    variant="ghost"
                    size="lg"
                    className="text-xl hover:text-white/90 hover:bg-gray-900/90 "
                  >
                    {item.name}
                  </ButtonLink>
                ))}
              </nav>
              <div className="flex items-center gap-2 ml-auto pr-1">
                {!isOverlayOpen && (
                  <>
                    <ButtonLink
                      href="/search"
                      variant="ghost"
                      size="icon-lg"
                      className="ml-auto hover:text-white/90 hover:bg-gray-900/90"
                    >
                      <Search className="size-6" />
                    </ButtonLink>
                    <ButtonLink
                      href="/categories"
                      variant="ghost"
                      size="icon-lg"
                      className="ml-auto hover:text-white/90 hover:bg-gray-900/90"
                    >
                      <Menu className="size-6" />
                    </ButtonLink>
                  </>
                )}
                {isOverlayOpen && (
                  <Button
                    variant="ghost"
                    size="icon-lg"
                    className="ml-auto hover:text-white/90 hover:bg-gray-900/90"
                    onClick={closeOverlayRoute}
                  >
                    <X className="size-8" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full items-center justify-between  px-4 py-3 flex md:hidden">
        <Button variant="ghost" size="icon-lg" asChild>
          <Link href="/categories">
            <Menu className="size-8" />
          </Link>
        </Button>
        <Link href="/" className="hover:scale-105">
          <LogoWithIcon size="sm" />
        </Link>
        <Button variant="ghost" size="icon-lg" asChild>
          <Link href="/search">
            <Search className="size-8" />
          </Link>
        </Button>
      </div>
    </>
  );
}
