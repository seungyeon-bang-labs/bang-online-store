import type { UserAddressViewModel } from '@/domains/member';
import { MypageAddressCard } from './card';

interface MypageAddressListProps {
  addresses: readonly UserAddressViewModel[];
}

export function MypageAddressList({ addresses }: MypageAddressListProps) {
  return (
    <div className="space-y-4">
      {addresses.map(address => (
        <MypageAddressCard key={address.id} address={address} />
      ))}
    </div>
  );
}
