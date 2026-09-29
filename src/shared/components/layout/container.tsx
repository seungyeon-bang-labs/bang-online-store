import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        'px-5 md:max-w-6xl md:px-8',
        className,
      )}
    >
      {children}
    </div>
  );
}
