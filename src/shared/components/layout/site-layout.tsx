import type { CSSProperties, ReactNode } from 'react';
import { Toaster } from '@/shared/components/ui/sonner';
import { Footer } from './footer';
import { ConditionalFooter } from './conditional-footer';
import { MobileBottomNav } from './mobile-bottom-nav';
import { OverlayRouteProvider } from './overlay-route-context';
import { cn } from '@/shared/lib/utils';

interface SiteLayoutProps {
  className?: string;
  categoryOverlay?: ReactNode;
  isLoggedIn: boolean;
  children: ReactNode;
  headerContent: ReactNode;
  search?: ReactNode;
}

export function SiteLayout({
  className,
  categoryOverlay,
  isLoggedIn,
  children,
  headerContent,
  search,
}: SiteLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen flex-col items-center pb-(--mobile-bottom-nav-height) font-sans [--site-header-height:3.5rem] dark:bg-black md:pb-0 md:[--site-header-height:6rem]',
        className,
      )}
      data-main-layout
      style={
        {
          // 48px touch target + 16px padding + 1px border + device safe area.
          '--mobile-bottom-nav-height':
            'calc(4rem + 1px + env(safe-area-inset-bottom, 0px))',
        } as CSSProperties
      }
    >
      <OverlayRouteProvider>
        <header
          className="fixed top-0 z-50 flex w-full items-center justify-center border-b border-gray-200 bg-white transition-transform duration-200 ease-out max-md:translate-y-(--mobile-product-header-translate,0px) md:translate-y-0 dark:border-gray-700"
          data-site-header
        >
          <div className="flex w-full flex-col items-center justify-center">
            {headerContent}
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
