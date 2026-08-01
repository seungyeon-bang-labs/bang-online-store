'use client';

import { useEffect } from 'react';

interface MypageMobileFilterScrollProps {
  targetId: string;
}

export function MypageMobileFilterScroll({
  targetId,
}: MypageMobileFilterScrollProps) {
  useEffect(() => {
    if (!window.matchMedia('(max-width: 639px)').matches) {
      return;
    }

    document.getElementById(targetId)?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
    });
  }, [targetId]);

  return null;
}
