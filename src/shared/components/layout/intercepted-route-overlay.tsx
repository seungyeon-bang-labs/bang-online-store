'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useCloseOverlayRoute } from '@/shared/hooks/use-close-overlay-route';
import { cn } from '@/shared/lib/utils';

interface InterceptedRouteOverlayProps {
  open: boolean;
  children: ReactNode;
  className?: string;
}

export function InterceptedRouteOverlay({
  open,
  children,
  className,
}: InterceptedRouteOverlayProps) {
  const closeOverlayRoute = useCloseOverlayRoute();

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full origin-top overflow-hidden animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-300',
        className,
      )}
    >
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            onClick={closeOverlayRoute}
            className="fixed inset-0 z-40 animate-in bg-black/40 fade-in backdrop-blur-[2px] duration-300"
            aria-hidden="true"
          />,
          document.body,
        )}

      {children}
    </div>
  );
}
