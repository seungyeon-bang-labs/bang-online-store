import { MapPin } from 'lucide-react';
import {
  currentUserRepository,
  toUserAddressViewModel,
  userAddressRepository,
} from '@/domains/member';
import {
  MypageEmptyState,
  MypagePageLayout,
  MypagePageHeader,
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

  const hasAddresses = addresses.length > 0;

  return (
    <MypagePageLayout fill>
      <MypagePageHeader
        title="배송지 관리"
        action={{
          href: getMypageAddressWriteHref(),
          label: '배송지 추가',
          mobilePlacement: 'header',
        }}
      />
      {hasAddresses ? (
        <MypageAddressList addresses={addresses} />
      ) : (
        <MypageEmptyState
          icon={MapPin}
          title="등록된 배송지가 없습니다."
          description="자주 사용하는 배송지를 등록하면 주문할 때 빠르게 선택할 수 있습니다."
          fill
        />
      )}
    </MypagePageLayout>
  );
}

export default AddressPage;
