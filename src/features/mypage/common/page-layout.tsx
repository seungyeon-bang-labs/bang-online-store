import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface MypagePageLayoutProps {
  children: ReactNode;
  className?: string;
  spacing?: 'default' | 'relaxed';
  mobileSpacing?: 'default' | 'flush';
  fill?: boolean;
}

export function MypagePageLayout({
  children,
  className,
  spacing = 'default',
  mobileSpacing = 'default',
  fill = false,
}: MypagePageLayoutProps) {
  return (
    <div
      className={cn(
        'flex flex-col',
        spacing === 'relaxed' ? 'gap-6 md:gap-10' : 'gap-5 md:gap-6',
        mobileSpacing === 'flush' && '-mt-5 md:mt-0',
        fill && 'md:h-full',
        className,
      )}
    >
      {children}
    </div>
  );
}
