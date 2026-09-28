import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib/utils';

interface MypageListStackProps extends ComponentPropsWithoutRef<'div'> {
  density?: 'compact' | 'default';
  layout?: 'stack' | 'grid';
}

export function MypageListStack({
  density = 'default',
  layout = 'stack',
  className,
  ...props
}: MypageListStackProps) {
  return (
    <div
      className={cn(
        layout === 'grid'
          ? density === 'compact' ? 'grid gap-4' : 'grid gap-6'
          : density === 'compact' ? 'space-y-4' : 'space-y-6',
        className,
      )}
      {...props}
    />
  );
}
