'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { loadDaumPostcodeScript } from './address-search-loader';

interface MypageAddressSearchButtonProps {
  onSelect: (address: { postalCode: string; addressLine1: string }) => void;
  onUnavailable: () => void;
}

export function MypageAddressSearchButton({
  onSelect,
  onUnavailable,
}: MypageAddressSearchButtonProps) {
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );

  useEffect(() => {
    let isMounted = true;

    void loadDaumPostcodeScript()
      .then(() => {
        if (isMounted) setLoadState('ready');
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadState('failed');
        onUnavailable();
      });

    return () => {
      isMounted = false;
    };
  }, [onUnavailable]);

  async function retryLoadDaumPostcodeScript() {
    setLoadState('loading');

    try {
      await loadDaumPostcodeScript({ retry: true });
      setLoadState('ready');
    } catch {
      setLoadState('failed');
      onUnavailable();
    }
  }

  function openAddressSearch() {
    try {
      const Postcode = window.daum?.Postcode;
      if (!Postcode) throw new Error('Daum postcode API is unavailable.');

      new Postcode({
        oncomplete: result => {
          onSelect({
            postalCode: result.zonecode,
            addressLine1: result.address,
          });
        },
      }).open();
    } catch {
      onUnavailable();
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loadState === 'loading'}
      onClick={
        loadState === 'failed' ? retryLoadDaumPostcodeScript : openAddressSearch
      }
      className="h-9 shrink-0 rounded-sm border-zinc-300 bg-white font-bold shadow-none hover:border-black hover:bg-white hover:text-black"
    >
      {loadState === 'loading'
        ? '불러오는 중'
        : loadState === 'failed'
          ? '다시 불러오기'
          : '주소 찾기'}
    </Button>
  );
}
