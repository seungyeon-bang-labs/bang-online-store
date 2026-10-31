import { MypageListStack } from '@/features/mypage/common/list-stack';
import type { UserAddressViewModel } from '@/domains/member';
import { MypageAddressCard } from './card';
import type { MypageAddressActions } from './types';

interface MypageAddressListProps extends MypageAddressActions {
  addresses: readonly UserAddressViewModel[];
}

export function MypageAddressList({
  addresses,
  ...actions
}: MypageAddressListProps) {
  return (
    <MypageListStack density="compact">
      {addresses.map(address => (
        <MypageAddressCard key={address.id} address={address} {...actions} />
      ))}
    </MypageListStack>
  );
}
