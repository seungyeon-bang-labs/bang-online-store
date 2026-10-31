'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MYPAGE_ACTION_CLASS_NAME } from '@/features/mypage/common/styles';
import { Button } from '@/shared/components/ui/button';
import type { MypageAddressActions } from './types';

type SetDefaultAddress = MypageAddressActions['onSetDefaultAddress'];

export function useSetDefaultAddress(
  addressId: string,
  onSetDefaultAddress: SetDefaultAddress,
) {
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  async function setDefaultAddress() {
    if (isSettingDefault) return;
    setIsSettingDefault(true);

    try {
      const isChanged = await onSetDefaultAddress(addressId);

      if (isChanged) {
        toast.success('기본 배송지로 설정했습니다.', {
          position: 'bottom-center',
        });
      } else {
        toast.error('기본 배송지로 설정하지 못했습니다.', {
          position: 'bottom-center',
        });
      }
    } catch {
      toast.error('기본 배송지로 설정하지 못했습니다.', {
        position: 'bottom-center',
      });
    } finally {
      setIsSettingDefault(false);
    }
  }

  return { isSettingDefault, setDefaultAddress };
}

interface MypageAddressSetDefaultButtonProps {
  addressId: string;
  onSetDefaultAddress: SetDefaultAddress;
}

export function MypageAddressSetDefaultButton({
  addressId,
  onSetDefaultAddress,
}: MypageAddressSetDefaultButtonProps) {
  const { isSettingDefault, setDefaultAddress } = useSetDefaultAddress(
    addressId,
    onSetDefaultAddress,
  );

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isSettingDefault}
      onClick={setDefaultAddress}
      className={`hidden shrink-0 md:inline-flex ${MYPAGE_ACTION_CLASS_NAME.outline}`}
    >
      {isSettingDefault ? '설정 중' : '기본으로 설정'}
    </Button>
  );
}
