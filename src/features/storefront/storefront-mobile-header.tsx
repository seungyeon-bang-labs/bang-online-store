'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { getCartItemCount, useCartStore } from '@/domains/cart';
import type { CategoryGroupViewModel } from '@/domains/category';
import { MainMobileHeader } from '@/shared/components/layout/main-mobile-header';
import { getCartHref } from '@/shared/lib/cart-routes';
import { getStorefrontMobileHeaderConfig } from './main-mobile-header-config';

interface StorefrontMobileHeaderProps {
  categoryGroupViewModels: readonly CategoryGroupViewModel[];
}

export function StorefrontMobileHeader({
  categoryGroupViewModels,
}: StorefrontMobileHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cartItemCount = useCartStore(state => getCartItemCount(state.items));
  const search = searchParams.toString();
  const currentHref = search ? `${pathname}?${search}` : pathname;
  const config = getStorefrontMobileHeaderConfig(
    pathname,
    categoryGroupViewModels,
    searchParams.get('returnTo'),
  );

  return (
    <MainMobileHeader
      activeHref={pathname}
      cartHref={getCartHref(currentHref)}
      cartItemCount={cartItemCount}
      config={config}
    />
  );
}
