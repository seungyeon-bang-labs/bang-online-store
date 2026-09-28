import { Suspense, type ReactNode } from 'react';
import { MypageMobileHeader } from '@/features/mypage/navigation/mobile-mypage-header';
import { CartAwareHeader } from '@/features/cart/cart-header';
import { currentUserRepository } from '@/domains/member';
import { SiteLayout } from '@/shared/components/layout/site-layout';

interface MypageRouteLayoutProps {
  children: ReactNode;
}

async function MypageRouteLayout({ children }: MypageRouteLayoutProps) {
  const user = await currentUserRepository.findCurrent();
  return (
    <SiteLayout
      className="min-h-dvh bg-zinc-50 pb-[var(--mobile-bottom-nav-height)] dark:bg-zinc-50 md:min-h-screen md:bg-transparent md:dark:bg-black"
      headerContent={
        <CartAwareHeader
          mobileContent={
            <Suspense
              fallback={<div aria-hidden="true" className="h-14 w-full md:hidden" />}
            >
              <MypageMobileHeader />
            </Suspense>
          }
        />
      }
      isLoggedIn={user !== null}
    >
      {children}
    </SiteLayout>
  );
}

export default MypageRouteLayout;
