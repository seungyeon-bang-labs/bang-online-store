'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';
import { loadDaumPostcodeScript } from './address-search-loader';

interface MypageAddressSearchButtonProps {
  errorMessageId?: string;
  onSelect: (address: { postalCode: string; addressLine1: string }) => void;
  onUnavailable: () => void;
}

export function MypageAddressSearchButton({
  errorMessageId,
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
      aria-describedby={errorMessageId}
      onClick={
        loadState === 'failed' ? retryLoadDaumPostcodeScript : openAddressSearch
      }
      className={`h-9 shrink-0 text-xs md:h-10 md:text-sm ${MYPAGE_ACTION_CLASS_NAME.outline}`}
    >
      {loadState === 'loading'
        ? '불러오는 중'
        : loadState === 'failed'
          ? '다시 불러오기'
          : '주소 찾기'}
    </Button>
  );
}
