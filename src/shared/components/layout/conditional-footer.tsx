'use client';

import type { ReactNode } from 'react';
import { useSelectedLayoutSegments } from 'next/navigation';
import { getFooterVisibility } from '@/shared/lib/footer-visibility';

export function ConditionalFooter({ children }: { children: ReactNode }) {
  // Read the main content branch: intercepted search/category routes change
  // the URL, but their background page must retain its footer visibility.
  const segments = useSelectedLayoutSegments('children');
  const visibility = getFooterVisibility(segments);

  if (visibility === 'hidden') return null;

  return (
    <div className={visibility === 'desktop-only' ? 'mt-auto hidden w-full md:block' : 'mt-auto w-full'}>
      {children}
    </div>
  );
}
