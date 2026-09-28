import { cn } from '@/shared/lib/utils';
import type { MypageCardMobileLayout } from './card';
import { MYPAGE_TYPOGRAPHY } from './styles';

interface MypagePolicyCardProps {
  items: readonly string[];
  ariaLabel?: string;
  listClassName?: string;
  mobileLayout?: MypageCardMobileLayout;
  title?: string;
}

export function MypagePolicyCard({
  items,
  ariaLabel,
  listClassName,
  mobileLayout = 'inset',
  title,
}: MypagePolicyCardProps) {
  const hasMultipleItems = items.length > 1;
  const verticalPadding = hasMultipleItems ? 'py-4 md:py-5' : 'py-3.5';
  const list = (
    <ul
      className={cn(
        'space-y-2.5 text-sm font-medium leading-relaxed text-zinc-600',
        hasMultipleItems && 'list-disc pl-5 marker:text-black',
        listClassName,
      )}
    >
      {items.map(item => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );

  if (!title) {
    return (
      <section
        aria-label={ariaLabel}
        className={cn(
          'rounded-md border border-zinc-200 bg-white px-4',
          mobileLayout === 'full-bleed' &&
            '-mx-4 rounded-none border-x-0 md:mx-0 md:rounded-md md:border-x',
          verticalPadding,
        )}
      >
        {list}
      </section>
    );
  }

  return (
    <section
      aria-label={ariaLabel}
      className={cn(
        'overflow-hidden rounded-md border border-zinc-200 bg-white',
        mobileLayout === 'full-bleed' &&
          '-mx-4 rounded-none border-x-0 md:mx-0 md:rounded-md md:border-x',
      )}
    >
      <header className="flex min-h-11 items-center border-b border-zinc-200 px-4 py-2.5 md:py-4">
        <h3 className={MYPAGE_TYPOGRAPHY.cardTitle}>{title}</h3>
      </header>
      <div className={cn('px-4', verticalPadding)}>{list}</div>
    </section>
  );
}
