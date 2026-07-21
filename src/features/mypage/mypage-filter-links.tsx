import Link from 'next/link';
import { cn } from '@/shared/lib/utils';

export interface MypageFilterOption<T extends string> {
  value: T;
  label: string;
}

interface MypageFilterLinksProps<T extends string> {
  label: string;
  options: readonly MypageFilterOption<T>[];
  current: T;
  getHref: (value: T) => string;
}

export function MypageFilterLinks<T extends string>({
  label,
  options,
  current,
  getHref,
}: MypageFilterLinksProps<T>) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {options.map(option => (
        <Link
          key={option.value}
          href={getHref(option.value)}
          aria-current={current === option.value ? 'page' : undefined}
          className={cn(
            'rounded-sm border px-3 py-2 text-sm font-bold',
            current === option.value
              ? 'border-black bg-black text-white'
              : 'border-zinc-300 bg-white text-zinc-600 hover:border-black',
          )}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
