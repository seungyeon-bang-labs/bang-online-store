import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

export interface MypageDetailInfoItem {
  id: string;
  label: ReactNode;
  value: ReactNode;
  valueLayout?: 'inline' | 'block';
  valueClassName?: string;
}

interface MypageDetailInfoListProps {
  className?: string;
  items: readonly MypageDetailInfoItem[];
  labelWidth?: 'narrow' | 'regular';
}

export function MypageDetailInfoList({
  className,
  items,
  labelWidth = 'regular',
}: MypageDetailInfoListProps) {
  return (
    <dl
      className={cn(
        'space-y-3 text-sm md:grid md:space-y-0 md:gap-x-3 md:gap-y-2',
        labelWidth === 'narrow'
          ? 'md:grid-cols-[72px_minmax(0,1fr)]'
          : 'md:grid-cols-[96px_minmax(0,1fr)]',
        className,
      )}
    >
      {items.map(item => {
        const isBlockValue = item.valueLayout === 'block';

        return (
        <div
          key={item.id}
          className={cn(
            isBlockValue
              ? 'grid gap-1 md:contents'
              : 'flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 md:contents',
          )}
        >
          <dt className="shrink-0 font-medium text-zinc-500">{item.label}</dt>
          <dd
            className={cn(
              'min-w-0 wrap-break-word font-bold text-black',
              isBlockValue
                ? 'text-left'
                : 'ml-auto max-w-full text-right md:ml-0 md:max-w-none md:text-left',
              item.valueClassName,
            )}
          >
            {item.value}
          </dd>
        </div>
        );
      })}
    </dl>
  );
}
