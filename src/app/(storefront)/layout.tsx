import { ReactNode, Suspense } from 'react';
import {
  categoryRepository,
  createCategoryGroups,
  toCategoryGroupViewModels,
} from '@/domains/category';
import { currentUserRepository } from '@/domains/member';
import { CartAwareHeader } from '@/features/cart/cart-header';
import { StorefrontMobileHeader } from '@/features/storefront/storefront-mobile-header';
import { SiteLayout } from '@/shared/components/layout/site-layout';

interface StorefrontRouteLayoutProps {
  children: ReactNode;
  search: ReactNode;
  category: ReactNode;
}

async function StorefrontRouteLayout({ children, search, category }: StorefrontRouteLayoutProps) {
  const [user, categories] = await Promise.all([
    currentUserRepository.findCurrent(),
    categoryRepository.findMany(),
  ]);
  const categoryGroupViewModels = toCategoryGroupViewModels(
    createCategoryGroups(categories),
  );

  return (
    <SiteLayout
      search={search}
      categoryOverlay={category}
      isLoggedIn={user !== null}
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
