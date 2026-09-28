import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { MYPAGE_TYPOGRAPHY } from './styles';

interface MypageCardContentBlockProps {
  title: string;
  meta?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'stacked' | 'inline';
}

export function MypageCardContentBlock({
  title,
  meta,
  right,
  children,
  className,
  variant = 'stacked',
}: MypageCardContentBlockProps) {
  if (variant === 'inline') {
    return (
      <section className={cn('rounded-sm bg-zinc-100 px-4 py-3', className)}>
        <div
          className={cn(
            'grid items-start gap-x-3',
            right
              ? 'grid-cols-[auto_minmax(0,1fr)] gap-y-1 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-y-0'
              : 'grid-cols-[auto_minmax(0,1fr)]',
          )}
        >
          <h4 className="text-sm font-medium text-zinc-500">{title}</h4>
          <div
            className={cn(
              MYPAGE_TYPOGRAPHY.body,
              'min-w-0 whitespace-pre-wrap break-words leading-relaxed text-zinc-900',
            )}
          >
            {children}
          </div>
          {right ? (
            <div className="col-span-2 justify-self-end text-right md:col-span-1 md:col-start-3 md:row-start-1">
              {right}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className={cn('rounded-sm bg-zinc-100 px-4 py-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-medium text-zinc-500">{title}</h4>
        {meta ? (
          <p className={cn(MYPAGE_TYPOGRAPHY.meta, 'text-zinc-400')}>{meta}</p>
        ) : null}
      </div>
      <div className={cn(MYPAGE_TYPOGRAPHY.body, 'mt-2 whitespace-pre-wrap leading-relaxed')}>
        {children}
      </div>
    </section>
  );
}
