'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button, ButtonLink } from '@/shared/components/ui/button';
import { Menu, Search, ShoppingCart, X } from 'lucide-react';
import { LogoWithIcon } from '@/shared/components/layout/logo';
import {
  filterMenuByAuth,
  PC_UTILITY_MENU,
  PC_MAIN_MENU,
} from '@/shared/lib/navigation';
import { useCloseOverlayRoute } from '@/shared/hooks/use-close-overlay-route';
import { useOverlayRoute } from '@/shared/components/layout/overlay-route-context';
import {
  CartItemCountBadge,
  getCartAriaLabel,
} from './cart-item-count-badge';

interface HeaderProps {
  mobileContent?: ReactNode;
  cartItemCount?: number;
}

export function Header({ mobileContent, cartItemCount = 0 }: HeaderProps) {
  const isLoggedIn = true;
  const closeOverlayRoute = useCloseOverlayRoute();
  const { activeOverlayRoute } = useOverlayRoute();
  const isOverlayOpen = activeOverlayRoute !== null;

  return (
    <>
      <div className="max-w-6xl w-full items-center justify-between  px-8 py-2 pb-4 hidden md:flex">
        <div className="flex w-full items-end justify-between gap-4 lg:gap-8">
          <Link href="/" className="hover:scale-105">
            <LogoWithIcon />
          </Link>
          <div className="flex w-full items-center justify-center flex-col">
            <div className="flex items-center justify-end gap-2 w-full">
              {filterMenuByAuth(PC_UTILITY_MENU, isLoggedIn).map(item => (
                <ButtonLink
                  key={item.href}
                  href={item.href}
                  aria-label={item.href === '/cart' ? getCartAriaLabel(cartItemCount) : undefined}
                  variant="ghost"
                  size="sm"
                  className="px-2 text-sm text-gray-500 hover:text-black"
                >
                  {item.name}
                  {item.href === '/cart' ? (
                    <CartItemCountBadge count={cartItemCount} className="ml-0.5" />
                  ) : null}
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
                    className="px-3 text-xl hover:bg-gray-900/90 hover:text-white/90 lg:px-6"
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
                      href="/category"
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

      {mobileContent ?? (
        <div className="flex h-14 w-full items-center justify-between md:hidden">
          <Link href="/" aria-label="BANG 홈" className="ml-4 hover:scale-105">
            <LogoWithIcon size="compact" className="gap-1" />
          </Link>
          <ButtonLink
            href="/cart"
            aria-label={getCartAriaLabel(cartItemCount)}
            variant="ghost"
            size="icon-md"
            className="mr-2"
          >
            <span className="relative inline-flex size-[22px]" aria-hidden="true">
              <ShoppingCart className="size-[22px]" />
              <CartItemCountBadge
                count={cartItemCount}
                className="pointer-events-none absolute -right-2 -top-2"
              />
            </span>
          </ButtonLink>
        </div>
      )}
    </>
  );
}
