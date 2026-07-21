import { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { OverlayRouteProvider } from '@/components/layout/overlay-route-context';

export const metadata: Metadata = {
  title: 'Bang Online Store',
  description: '남성복 전문 온라인 쇼핑몰',
};

interface LayoutProps {
  children: ReactNode;
  search: ReactNode;
  categories: ReactNode;
}

function Layout({ children, search, categories }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center pt-15 md:pt-24 pb-20 font-sans dark:bg-black md:pb-0">
      <OverlayRouteProvider>
        <header className="fixed top-0 z-50 flex w-full items-center justify-center border-b border-gray-200 bg-white dark:border-gray-700">
          <div className="flex flex-col w-full justify-center items-center">
            <Header />
            {search}
            {categories}
          </div>
        </header>
      </OverlayRouteProvider>

      {children}

      <Footer />

      <div className="md:hidden">
        <MobileBottomNav />
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

export default Layout;
