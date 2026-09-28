'use client';

import { usePathname } from 'next/navigation';
import { InterceptedRouteOverlay } from '@/shared/components/layout/intercepted-route-overlay';
import { CategoryPanel } from '@/features/category/category-panel';
import { useRegisterOverlayRoute } from '@/shared/components/layout/overlay-route-context';

function Page() {
  const pathname = usePathname();
  const isCategoryOverlayOpen = pathname === '/category';
  useRegisterOverlayRoute('category', isCategoryOverlayOpen);

  return (
    <InterceptedRouteOverlay
      open={isCategoryOverlayOpen}
      className="max-w-6xl px-4 py-3 md:px-8"
    >
      <CategoryPanel />
    </InterceptedRouteOverlay>
  );
}

export default Page;
