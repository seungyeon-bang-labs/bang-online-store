'use client';

import Link from 'next/link';
import { ChevronLeft, ShoppingCart } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { CATEGORIES } from '@/shared/lib/navigation';
import { getCartHref } from '@/shared/lib/cart-routes';
import { ButtonLink } from '@/shared/components/ui/button';
import { CategorySwitcher } from '@/shared/components/common/category-switcher';
import { MobileProductNavigation } from './mobile-product-navigation';
import { MobileProductPageTabs } from './mobile-product-page-tabs';
import { LogoWithIcon } from './logo';
import { getMainMobileHeaderConfig } from './main-mobile-header-config';
import {
  CartItemCountBadge,
  getCartAriaLabel,
} from './cart-item-count-badge';

const HEADER_TRANSLATE_HIDDEN = '-3.5rem';
const HIDE_SCROLL_THRESHOLD = 16;
const SHOW_SCROLL_THRESHOLD = 10;

function MobileProductHeader({
  activeHref,
  cartHref,
  cartItemCount,
}: {
  activeHref: string;
  cartHref: string;
  cartItemCount: number;
}) {
  useEffect(() => {
    let previousScrollY = Math.max(window.scrollY, 0);
    let accumulatedScroll = 0;
    let isVisible = true;

    const setVisibility = (nextIsVisible: boolean) => {
      if (isVisible === nextIsVisible) return;

      isVisible = nextIsVisible;
      document.documentElement.style.setProperty(
        '--mobile-product-header-translate',
        nextIsVisible ? '0px' : HEADER_TRANSLATE_HIDDEN,
      );
    };

    const handleScroll = () => {
      const currentScrollY = Math.max(window.scrollY, 0);

      if (currentScrollY <= HIDE_SCROLL_THRESHOLD) {
        accumulatedScroll = 0;
        setVisibility(true);
        previousScrollY = currentScrollY;
        return;
      }

      const scrollDelta = currentScrollY - previousScrollY;
      previousScrollY = currentScrollY;

      if (Math.abs(scrollDelta) < 1) return;

      const isScrollingDown = scrollDelta > 0;
      const isMovingTowardNextState =
        (isScrollingDown && isVisible) || (!isScrollingDown && !isVisible);

      accumulatedScroll = isMovingTowardNextState
        ? accumulatedScroll + Math.abs(scrollDelta)
        : Math.abs(scrollDelta);

      if (
        isScrollingDown &&
        isVisible &&
        accumulatedScroll >= HIDE_SCROLL_THRESHOLD
      ) {
        accumulatedScroll = 0;
        setVisibility(false);
      }

      if (
        !isScrollingDown &&
        !isVisible &&
        accumulatedScroll >= SHOW_SCROLL_THRESHOLD
      ) {
        accumulatedScroll = 0;
        setVisibility(true);
      }
    };

    document.documentElement.style.setProperty(
      '--mobile-product-header-translate',
      '0px',
    );
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.style.removeProperty(
        '--mobile-product-header-translate',
      );
    };
  }, []);

  return (
    <>
      <div className="flex h-14 w-full items-center justify-between md:hidden">
        <Link href="/" aria-label="BANG 홈" className="ml-4 hover:scale-105">
          <LogoWithIcon size="compact" className="gap-1" />
        </Link>
        <ButtonLink
          href={cartHref}
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
      <MobileProductNavigation activeHref={activeHref} />
      <MobileProductPageTabs />
    </>
  );
}

interface MainMobileHeaderProps {
  cartItemCount?: number;
}

export function MainMobileHeader({
  cartItemCount = 0,
}: MainMobileHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const currentHref = search ? `${pathname}?${search}` : pathname;
  const cartHref = getCartHref(currentHref);
  const config = getMainMobileHeaderConfig(
    pathname,
    CATEGORIES,
    searchParams.get('returnTo'),
  );

  if (config.kind === 'brand') {
    return (
      <MobileProductHeader
        activeHref={pathname}
        cartHref={cartHref}
        cartItemCount={cartItemCount}
      />
    );
  }

  return (
    <div className="grid h-14 w-full grid-cols-[3.5rem_minmax(0,1fr)_3.5rem] items-center bg-white md:hidden">
      {config.kind === 'title' && config.backHref ? (
        <ButtonLink
          href={config.backHref}
          aria-label="이전 페이지로"
          variant="ghost"
          size="icon-md"
          className="ml-2 justify-self-start"
        >
          <ChevronLeft className="size-[22px]" strokeWidth={2} aria-hidden="true" />
        </ButtonLink>
      ) : (
        <span aria-hidden="true" />
      )}

      {config.kind === 'category' ? (
        <div className="justify-self-center">
          <CategorySwitcher
            current={config.title}
            siblings={config.siblings}
            variant="mobile-header"
          />
        </div>
      ) : (
        <p className="truncate text-center text-lg font-bold leading-6 text-black">
          {config.title}
        </p>
      )}

      {config.action === 'cart' ? (
        <ButtonLink
          href={cartHref}
          aria-label={getCartAriaLabel(cartItemCount)}
          variant="ghost"
          size="icon-md"
          className="mr-2 justify-self-end"
        >
          <span className="relative inline-flex size-[22px]" aria-hidden="true">
            <ShoppingCart className="size-[22px]" />
            <CartItemCountBadge
              count={cartItemCount}
              className="pointer-events-none absolute -right-2 -top-2"
            />
          </span>
        </ButtonLink>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}
