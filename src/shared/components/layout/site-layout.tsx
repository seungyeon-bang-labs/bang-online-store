import type { CSSProperties, ReactNode } from 'react';
import { Toaster } from '@/shared/components/ui/sonner';
import { Footer } from './footer';
import { ConditionalFooter } from './conditional-footer';
import { Header } from './header';
import { MobileBottomNav } from './mobile-bottom-nav';
import { OverlayRouteProvider } from './overlay-route-context';
import { cn } from '@/shared/lib/utils';

interface SiteLayoutProps {
  className?: string;
  categoryOverlay?: ReactNode;
  isLoggedIn: boolean;
  children: ReactNode;
  headerContent?: ReactNode;
  mobileHeader?: ReactNode;
  search?: ReactNode;
}

export function SiteLayout({
  className,
  categoryOverlay,
  isLoggedIn,
  children,
  headerContent,
  mobileHeader,
  search,
}: SiteLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center pt-14 pb-20 font-sans dark:bg-black md:pt-24 md:pb-0',
        className,
      )}
      data-main-layout
      style={{
        // 48px touch target + 16px padding + 1px border + device safe area.
        '--mobile-bottom-nav-height': 'calc(4rem + 1px + env(safe-area-inset-bottom, 0px))',
      } as CSSProperties}
    >
      <OverlayRouteProvider>
        <header
          className="fixed top-0 z-50 flex w-full items-center justify-center border-b border-gray-200 bg-white transition-transform duration-200 ease-out max-md:translate-y-[var(--mobile-product-header-translate,0px)] md:translate-y-0 dark:border-gray-700"
          data-site-header
        >
          <div className="flex w-full flex-col items-center justify-center">
            {headerContent ?? <Header mobileContent={mobileHeader} />}
            {search}
            {categoryOverlay}
          </div>
        </header>
      </OverlayRouteProvider>

      {children}

      <ConditionalFooter>
        <Footer />
      </ConditionalFooter>

      <div className="md:hidden" data-mobile-bottom-navigation>
        <MobileBottomNav isLoggedIn={isLoggedIn} />
      </div>
      <Toaster
        toastOptions={{
          style: {
            background: '#000000',
            color: '#ffffff',
            border: '1px solid #27272a',
            fontSize: '14px',
          },
          className: 'my-toast',
          actionButtonStyle: {
            background: '#ffffff',
            color: '#000000',
            borderRadius: '4px',
            fontWeight: 'bold',
          },
        }}
      />
    </div>
  );
}
