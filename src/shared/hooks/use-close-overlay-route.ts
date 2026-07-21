'use client';

import { useRouter } from 'next/navigation';

export function useCloseOverlayRoute() {
  const router = useRouter();

  return () => {
    if (
      window.history.length > 1 &&
      document.referrer &&
      document.referrer.includes(window.location.host)
    ) {
      router.back();
      return;
    }

    router.push('/');
  };
}
