import { notFound } from 'next/navigation';
import {
  currentUserRepository,
  toUserAddressFormViewModel,
  userAddressRepository,
} from '@/domains/member';
import { MypageAddressForm } from '@/features/mypage/addresses';
import { MypagePageLayout } from '@/features/mypage/common';
import { getMypageAddressHref } from '@/shared/lib/mypage-routes';

interface MypageAddressEditPageProps {
  params: Promise<{ addressId: string }>;
}

async function MypageAddressEditPage({ params }: MypageAddressEditPageProps) {
  const [{ addressId }, user] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
  ]);
  const address = user
    ? await userAddressRepository.findByIdAndUserId(addressId, user.id)
    : null;
  if (!address) notFound();

  return (
    <MypagePageLayout className="-mt-5 md:mt-0">
      <MypageAddressForm
        mode="edit"
        initialAddress={toUserAddressFormViewModel(address)}
        returnHref={getMypageAddressHref()}
      />
    </MypagePageLayout>
  );
}

export default MypageAddressEditPage;
