import { ReactNode, Suspense } from 'react';
import { Metadata } from 'next';
import { currentUserRepository } from '@/domains/member';
import {
  CartAwareHeader,
  CartAwareMainMobileHeader,
} from '@/features/cart/cart-header';
import { SiteLayout } from '@/shared/components/layout/site-layout';

export const metadata: Metadata = {
  title: 'Bang Online Store',
  description: '남성복 전문 온라인 쇼핑몰',
};

interface LayoutProps {
  children: ReactNode;
  search: ReactNode;
  category: ReactNode;
}

async function Layout({ children, search, category }: LayoutProps) {
  const user = await currentUserRepository.findCurrent();
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
              <CartAwareMainMobileHeader />
            </Suspense>
          }
        />
      }
    >
      {children}
    </SiteLayout>
  );
}

export default Layout;
