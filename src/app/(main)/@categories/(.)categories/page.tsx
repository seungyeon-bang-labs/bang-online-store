'use client';

import { usePathname } from 'next/navigation';
import { InterceptedRouteOverlay } from '@/components/layout/intercepted-route-overlay';
import { CategoryPanel } from '@/features/category/category-panel';
import { useRegisterOverlayRoute } from '@/components/layout/overlay-route-context';

function Page() {
  const pathname = usePathname();
  const isCategoriesOpen = pathname === '/categories';
  useRegisterOverlayRoute('categories', isCategoriesOpen);

  return (
    <InterceptedRouteOverlay
      open={isCategoriesOpen}
      className="max-w-6xl px-4 py-3 md:px-8"
    >
      <CategoryPanel />
    </InterceptedRouteOverlay>
  );
}

export default Page;
