import Link from 'next/link';
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
import { getMypageAddressWriteHref } from '@/shared/lib/mypage-routes';

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
            size="lg"
            asChild
            className="w-full bg-black font-bold text-white hover:bg-zinc-800 md:w-auto"
          >
            <Link href={getMypageAddressWriteHref()}>배송지 추가</Link>
          </Button>
        }
      />
      <Button
        size="lg"
        asChild
        className="h-12 w-full bg-black font-bold text-white hover:bg-zinc-800 md:hidden"
      >
        <Link href={getMypageAddressWriteHref()}>배송지 추가</Link>
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
