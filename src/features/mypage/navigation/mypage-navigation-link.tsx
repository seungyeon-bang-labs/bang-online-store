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

type NextLinkProps = ComponentPropsWithoutRef<typeof Link>;

interface MypageNavigationLinkProps
  extends Omit<
    NextLinkProps,
    'href' | 'children' | 'className' | 'aria-current'
  > {
  pathname: string;
  item: MypageMenuItem;
  className?: string;
}

export const MypageNavigationLink = forwardRef<
  HTMLAnchorElement,
  MypageNavigationLinkProps
>(function MypageNavigationLink(
  { pathname, item, className, ...props },
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
        'flex w-full items-center rounded-sm px-3 py-2 text-sm font-bold transition-colors',
        isActive
          ? 'bg-black text-white'
          : 'text-zinc-800 hover:bg-zinc-100 hover:text-black',
      )}
    >
      {item.label}
    </Link>
  );
});
