'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SCROLL_EDGE_THRESHOLD = 1;

interface OrderStatusScrollIndicators {
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

export function useOrderStatusScrollIndicators(itemCount: number) {
  const listRef = useRef<HTMLUListElement>(null);
  const [indicators, setIndicators] = useState<OrderStatusScrollIndicators>({
    canScrollLeft: false,
    canScrollRight: false,
  });

  const updateScrollIndicators = useCallback(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    const maxScrollLeft = list.scrollWidth - list.clientWidth;
    const nextIndicators = {
      canScrollLeft: list.scrollLeft > SCROLL_EDGE_THRESHOLD,
      canScrollRight:
        list.scrollLeft < maxScrollLeft - SCROLL_EDGE_THRESHOLD,
    };

    setIndicators(currentIndicators => {
      if (
        currentIndicators.canScrollLeft === nextIndicators.canScrollLeft &&
        currentIndicators.canScrollRight === nextIndicators.canScrollRight
      ) {
        return currentIndicators;
      }

      return nextIndicators;
    });
  }, []);

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    const frameId = window.requestAnimationFrame(updateScrollIndicators);
    const resizeObserver = new ResizeObserver(updateScrollIndicators);

    list.addEventListener('scroll', updateScrollIndicators, { passive: true });
    resizeObserver.observe(list);

    return () => {
      window.cancelAnimationFrame(frameId);
      list.removeEventListener('scroll', updateScrollIndicators);
      resizeObserver.disconnect();
    };
  }, [itemCount, updateScrollIndicators]);

  return {
    listRef,
    canScrollLeft: indicators.canScrollLeft,
    canScrollRight: indicators.canScrollRight,
  };
}
