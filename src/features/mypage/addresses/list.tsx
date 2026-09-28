import { MypageListStack } from '@/features/mypage/common/list-stack';
import type { UserAddressViewModel } from '@/domains/member';
import { MypageAddressCard } from './card';

interface MypageAddressListProps {
  addresses: readonly UserAddressViewModel[];
}

export function MypageAddressList({ addresses }: MypageAddressListProps) {
  return (
    <MypageListStack density="compact">
      {addresses.map(address => (
        <MypageAddressCard key={address.id} address={address} />
      ))}
    </MypageListStack>
  );
}
