'use client';

import Link from 'next/link';
import type { MouseEvent, ReactNode } from 'react';

interface MobileCategoryPageLinkProps {
  href: string;
  className: string;
  children: ReactNode;
}

export function MobileCategoryPageLink({
  href,
  className,
  children,
}: MobileCategoryPageLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (window.location.pathname === href) {
      window.location.reload();
      return;
    }

    window.location.assign(href);
  }

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}
