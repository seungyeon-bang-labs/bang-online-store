import { notFound } from 'next/navigation';
import {
  toUserAddressFormViewModel,
  userAddressRepository,
} from '@/domains/member';
import { MypageAddressForm } from '@/features/mypage/addresses';
import { getMypageAddressHref } from '@/shared/lib/mypage-routes';

interface MypageAddressEditPageProps {
  params: Promise<{ addressId: string }>;
}

async function MypageAddressEditPage({ params }: MypageAddressEditPageProps) {
  const { addressId } = await params;
  const address = await userAddressRepository.findById(addressId);
  if (!address) notFound();

  return (
    <div className="space-y-8">
      <MypageAddressForm
        mode="edit"
        initialAddress={toUserAddressFormViewModel(address)}
        returnHref={getMypageAddressHref()}
      />
    </div>
  );
}

export default MypageAddressEditPage;
