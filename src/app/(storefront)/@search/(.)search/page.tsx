'use client';

import { usePathname } from 'next/navigation';
import { InterceptedRouteOverlay } from '@/shared/components/layout/intercepted-route-overlay';
import { SearchPanel } from '@/features/search/search-panel';
import { useRegisterOverlayRoute } from '@/shared/components/layout/overlay-route-context';

function SearchPage() {
  const pathname = usePathname();
  const isSearchOpen = pathname === '/search';
  useRegisterOverlayRoute('search', isSearchOpen);

  return (
    <InterceptedRouteOverlay
      open={isSearchOpen}
      className="max-w-6xl px-4 py-3 md:px-8"
    >
      <div className="relative z-50 bg-white">
        <SearchPanel />
      </div>
    </InterceptedRouteOverlay>
  );
}

export default SearchPage;
