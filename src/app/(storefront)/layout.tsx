import { ReactNode, Suspense } from 'react';
import {
  categoryRepository,
  createCategoryGroups,
  toCategoryGroupViewModels,
} from '@/domains/category';
import { logoutAction } from '@/app/(auth)/actions';
import { getCurrentMemberAccess } from '@/domains/auth/member-access.server';
import { LogoutButton } from '@/features/auth/logout-button';
import { CartAwareHeader } from '@/features/cart/cart-header';
import { StorefrontMobileHeader } from '@/features/storefront/storefront-mobile-header';
import { SiteLayout } from '@/shared/components/layout/site-layout';

interface StorefrontRouteLayoutProps {
  children: ReactNode;
  search: ReactNode;
  category: ReactNode;
}

async function StorefrontRouteLayout({ children, search, category }: StorefrontRouteLayoutProps) {
  const [access, categories] = await Promise.all([
    getCurrentMemberAccess(),
    categoryRepository.findMany(),
  ]);
  if (access.status === 'error') {
    throw new Error('회원 정보를 확인하지 못했습니다. 다시 시도해주세요.');
  }
  const isLoggedIn = access.status === 'active';
  const categoryGroupViewModels = toCategoryGroupViewModels(
    createCategoryGroups(categories),
  );

  return (
    <SiteLayout
      search={search}
      categoryOverlay={category}
      isLoggedIn={isLoggedIn}
      headerContent={
        <CartAwareHeader
          mobileContent={
            <Suspense
              fallback={<div aria-hidden="true" className="h-14 w-full md:hidden" />}
            >
              <StorefrontMobileHeader
                categoryGroupViewModels={categoryGroupViewModels}
              />
            </Suspense>
          }
          isLoggedIn={isLoggedIn}
          logoutControl={isLoggedIn ? (
            <LogoutButton
              logoutAction={logoutAction}
              variant="ghost"
              size="sm"
              className="px-2 text-sm text-gray-500 hover:text-black"
            />
          ) : null}
        />
      }
    >
      <main
        id="main-content"
        className="flex w-full flex-1 flex-col pt-(--site-header-height)"
      >
        {children}
      </main>
    </SiteLayout>
  );
}

export default StorefrontRouteLayout;
