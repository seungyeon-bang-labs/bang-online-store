import { Suspense, type ReactNode } from 'react';
import { currentUserRepository } from '@/domains/member';
import { CartAwareHeader } from '@/features/cart/cart-header';
import { MypageMobileHeader } from '@/features/mypage/navigation/mobile-mypage-header';
import { SiteLayout } from '@/shared/components/layout/site-layout';

interface MypageRouteLayoutProps {
  children: ReactNode;
}

async function MypageRouteLayout({ children }: MypageRouteLayoutProps) {
  const user = await currentUserRepository.findCurrent();

  return (
    <SiteLayout
      className="min-h-dvh bg-zinc-50 dark:bg-zinc-50 md:min-h-screen md:bg-transparent md:dark:bg-black"
      isLoggedIn={user !== null}
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
    >
      <main
        id="main-content"
        className="flex w-full flex-1 flex-col bg-zinc-50 pt-(--site-header-height) dark:bg-zinc-50 md:bg-transparent md:dark:bg-black"
      >
        {children}
      </main>
    </SiteLayout>
  );
}

export default MypageRouteLayout;
