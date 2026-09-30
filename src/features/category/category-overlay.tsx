'use client';

import { usePathname } from 'next/navigation';
import type { CategoryGroupViewModel } from '@/domains/category';
import { InterceptedRouteOverlay } from '@/shared/components/layout/intercepted-route-overlay';
import { useRegisterOverlayRoute } from '@/shared/components/layout/overlay-route-context';
import { CategoryPanel } from './category-panel';

interface CategoryOverlayProps {
  categoryGroupViewModels: readonly CategoryGroupViewModel[];
}

export function CategoryOverlay({
  categoryGroupViewModels,
}: CategoryOverlayProps) {
  const pathname = usePathname();
  const isCategoryOverlayOpen = pathname === '/category';
  useRegisterOverlayRoute('category', isCategoryOverlayOpen);

  return (
    <InterceptedRouteOverlay
      open={isCategoryOverlayOpen}
      className="max-w-6xl px-4 py-3 md:px-8"
    >
      <CategoryPanel categoryGroupViewModels={categoryGroupViewModels} />
    </InterceptedRouteOverlay>
  );
}
