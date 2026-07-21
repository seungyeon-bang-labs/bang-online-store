import { ReactNode } from 'react';
import Link from 'next/link';
import { LogoWithIcon } from '@/components/layout/logo';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center py-8 sm:bg-accent">
      <div className="flex w-full max-w-md flex-col gap-8 p-4 sm:p-8 sm:border sm:rounded-lg sm:shadow-md bg-background">
        <header className="flex justify-center my-6">
          <Link href="/" className="hover:scale-105 transition-transform">
            <LogoWithIcon />
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}

export default Layout;
