import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  currentUserRepository,
  toUserAddressViewModel,
  userAddressRepository,
} from '@/domains/member';
import {
  MypageEmptyState,
  MypageSectionHeader,
} from '@/features/mypage/common';
import { MypageAddressList } from '@/features/mypage/addresses';

async function AddressPage() {
  const user = await currentUserRepository.findCurrent();
  const addresses = user
    ? (await userAddressRepository.findByUserId(user.id)).map(
        toUserAddressViewModel,
      )
    : [];

  return (
    <div className="space-y-8">
      <MypageSectionHeader
        title="배송지 관리"
        action={
          <Button
            type="button"
            size="lg"
            className="w-full bg-black font-bold text-white hover:bg-zinc-800 md:w-auto"
          >
            배송지 추가
          </Button>
        }
      />
      <Button
        type="button"
        size="lg"
        className="h-12 w-full bg-black font-bold text-white hover:bg-zinc-800 md:hidden"
      >
        배송지 추가
      </Button>
      {addresses.length !== 0 ? (
        <MypageAddressList addresses={addresses} />
      ) : (
        <MypageEmptyState
          icon={MapPin}
          title="등록된 배송지가 없습니다."
          description="자주 사용하는 배송지를 등록하면 주문할 때 빠르게 선택할 수 있습니다."
        />
      )}
    </div>
  );
}

export default AddressPage;
