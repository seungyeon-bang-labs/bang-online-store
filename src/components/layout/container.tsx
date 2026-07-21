import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface ContainerProps {
  children: ReactNode;
  isPageWrapper?: boolean;
  className?: string;
}

export function Container({
  children,
  isPageWrapper = true,
  className,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        'px-5 py-6 md:max-w-6xl md:px-8 md:py-10',
        isPageWrapper && 'mb-20',
        className,
      )}
    >
      {children}
    </div>
  );
}
