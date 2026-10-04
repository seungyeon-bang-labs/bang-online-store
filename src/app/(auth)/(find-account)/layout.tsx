import { ReactNode } from 'react';
import { Separator } from '@/shared/components/ui/separator';
import { ButtonLink } from '@/shared/components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col">
      {children}
      <div className="hidden flex-col gap-8 md:flex">
        <Separator label="또는" />
        <div className="flex flex-col gap-3">
          <ButtonLink href="/login" variant="outline" size="xl">
            로그인 페이지로 이동
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

export default Layout;
