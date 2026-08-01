import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { MypageMobileFilterScroll } from './mobile-filter-scroll';

export interface MypageFilterOption<T extends string> {
  value: T;
  label: string;
}

interface MypageFilterLinksProps<T extends string> {
  label: string;
  options: readonly MypageFilterOption<T>[];
  current: T;
  getHref: (value: T) => string;
  mobileScrollable?: boolean;
  scrollTargetId?: string;
}

export function MypageFilterLinks<T extends string>({
  label,
  options,
  current,
  getHref,
  mobileScrollable = false,
  scrollTargetId,
}: MypageFilterLinksProps<T>) {
  const activeOptionId =
    mobileScrollable && scrollTargetId
      ? `${scrollTargetId}-${current}`
      : undefined;

  return (
    <nav
      aria-label={label}
      className={cn(
        'flex gap-2',
        mobileScrollable
          ? '-mx-4 flex-nowrap overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0'
          : 'flex-wrap',
      )}
    >
      {options.map(option => (
        <Link
          key={option.value}
          href={getHref(option.value)}
          id={current === option.value ? activeOptionId : undefined}
          aria-current={current === option.value ? 'page' : undefined}
          className={cn(
            'rounded-sm border px-3 py-2 text-sm font-bold',
            mobileScrollable && 'shrink-0 scroll-mx-4',
            current === option.value
              ? 'border-black bg-black text-white'
              : 'border-zinc-300 bg-white text-zinc-600 hover:border-black',
          )}
        >
          {option.label}
        </Link>
      ))}
      {activeOptionId && <MypageMobileFilterScroll targetId={activeOptionId} />}
    </nav>
  );
}
