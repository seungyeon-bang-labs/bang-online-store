'use client';

import {
  forwardRef,
  type ComponentPropsWithoutRef,
} from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import {
  isMypagePathActive,
  type MypageMenuItem,
} from './mypage-menu';

type MypageNavigationLinkVariant = 'mobile' | 'desktop';
type NextLinkProps = ComponentPropsWithoutRef<typeof Link>;

interface MypageNavigationLinkProps
  extends Omit<
    NextLinkProps,
    'href' | 'children' | 'className' | 'aria-current'
  > {
  pathname: string;
  item: MypageMenuItem;
  variant: MypageNavigationLinkVariant;
  className?: string;
}

const variantClassNames: Record<MypageNavigationLinkVariant, string> = {
  mobile:
    'w-full cursor-pointer justify-center rounded-sm px-3 py-2 text-sm font-bold transition-colors',
  desktop:
    'flex w-full items-center rounded-sm px-3 py-2 text-sm font-bold transition-colors',
};

const inactiveClassNames: Record<MypageNavigationLinkVariant, string> = {
  mobile: 'text-zinc-800 hover:bg-zinc-100',
  desktop: 'text-zinc-800 hover:bg-zinc-100 hover:text-black',
};

export const MypageNavigationLink = forwardRef<
  HTMLAnchorElement,
  MypageNavigationLinkProps
>(function MypageNavigationLink(
  { pathname, item, variant, className, ...props },
  forwardedRef,
) {
  const isActive = isMypagePathActive(pathname, item.href);

  return (
    <Link
      {...props}
      ref={forwardedRef}
      href={item.href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        className,
        variantClassNames[variant],
        isActive ? 'bg-black text-white' : inactiveClassNames[variant],
      )}
    >
      {item.label}
    </Link>
  );
});
