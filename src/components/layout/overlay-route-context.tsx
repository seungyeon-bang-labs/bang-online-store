'use client';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

type OverlayRoute = 'search' | 'categories';

interface OverlayRouteContextValue {
  activeOverlayRoute: OverlayRoute | null;
  setActiveOverlayRoute: (route: OverlayRoute | null) => void;
}

const OverlayRouteContext = createContext<OverlayRouteContextValue | null>(null);

export function OverlayRouteProvider({ children }: { children: ReactNode }) {
  const [activeOverlayRoute, setActiveOverlayRoute] =
    useState<OverlayRoute | null>(null);

  const value = useMemo(
    () => ({ activeOverlayRoute, setActiveOverlayRoute }),
    [activeOverlayRoute],
  );

  return (
    <OverlayRouteContext.Provider value={value}>
      {children}
    </OverlayRouteContext.Provider>
  );
}

export function useOverlayRoute() {
  const context = useContext(OverlayRouteContext);

  if (!context) {
    throw new Error('useOverlayRoute must be used within OverlayRouteProvider');
  }

  return context;
}

export function useRegisterOverlayRoute(route: OverlayRoute, open: boolean) {
  const { setActiveOverlayRoute } = useOverlayRoute();

  useEffect(() => {
    if (!open) return;

    setActiveOverlayRoute(route);

    return () => {
      setActiveOverlayRoute(null);
    };
  }, [open, route, setActiveOverlayRoute]);
}
