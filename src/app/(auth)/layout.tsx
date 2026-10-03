import { ReactNode, Suspense } from 'react';
import Link from 'next/link';
import { AuthMobileHeader } from '@/features/auth/auth-mobile-header';
import { LogoWithIcon } from '@/shared/components/layout/logo';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-dvh bg-background md:flex md:min-h-screen md:items-center md:justify-center md:bg-accent md:py-8">
      <Suspense
        fallback={<div aria-hidden="true" className="h-14 w-full md:hidden" />}
      >
        <AuthMobileHeader />
      </Suspense>
      <div className="flex w-full max-w-md flex-col gap-8 bg-background p-4 md:rounded-lg md:border md:p-8 md:shadow-md">
        <header className="hidden justify-center md:my-6 md:flex">
          <Link href="/" className="hover:scale-105 transition-transform">
            <LogoWithIcon />
          </Link>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

export default Layout;
