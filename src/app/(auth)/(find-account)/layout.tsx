import { ReactNode } from 'react';
import { Separator } from '@/shared/components/ui/separator';
import { ButtonLink } from '@/shared/components/ui/button';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <>
      {children}
      <Separator label="또는" />
      <ButtonLink href="/login" variant="outline" size="xl">
        로그인 페이지로 이동
      </ButtonLink>
    </>
  );
}

export default Layout;
