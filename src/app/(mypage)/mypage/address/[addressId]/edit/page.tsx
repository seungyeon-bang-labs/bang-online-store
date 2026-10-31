import { notFound } from 'next/navigation';
import { requireActiveMember } from '@/app/(auth)/require-active-member';
import { toUserAddressFormViewModel } from '@/domains/member';
import { createUserAddressRepository } from '@/domains/member/supabase-repository.server';
import { MypageAddressForm } from '@/features/mypage/addresses';
import { MypagePageLayout } from '@/features/mypage/common';
import { getMypageAddressHref } from '@/shared/lib/mypage-routes';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import { updateMypageAddressAction } from '../../actions';

interface MypageAddressEditPageProps {
  params: Promise<{ addressId: string }>;
}

async function MypageAddressEditPage({ params }: MypageAddressEditPageProps) {
  const [{ addressId }, member] = await Promise.all([
    params,
    requireActiveMember(),
  ]);
  const client = await createAuthClient();
  const address = await createUserAddressRepository(client)
    .findByIdAndUserId(addressId, member.id);
  if (!address) notFound();

  return (
    <MypagePageLayout mobileSpacing="flush">
      <MypageAddressForm
        mode="edit"
        initialAddress={toUserAddressFormViewModel(address)}
        returnHref={getMypageAddressHref()}
        onSubmitAddress={updateMypageAddressAction.bind(null, address.id)}
      />
    </MypagePageLayout>
  );
}

export default MypageAddressEditPage;
