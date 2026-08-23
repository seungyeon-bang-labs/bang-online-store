import { notFound } from 'next/navigation';
import { currentUserRepository } from '@/domains/member';
import { getOrderClaimDetailViewModel } from '@/domains/order';
import { MypageSectionHeader } from '@/features/mypage/common';
import { MypageClaimDetail } from '@/features/mypage/returns';

interface ClaimDetailPageProps {
  params: Promise<{ claimId: string }>;
}

async function ClaimDetailPage({ params }: ClaimDetailPageProps) {
  const [{ claimId }, user] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
  ]);
  const claimDetailViewModel = user
    ? await getOrderClaimDetailViewModel(user.id, claimId)
    : null;

  if (!claimDetailViewModel) notFound();

  return (
    <div className="space-y-8">
      <MypageSectionHeader title="교환·반품 상세" />
      <MypageClaimDetail detail={claimDetailViewModel} />
    </div>
  );
}

export default ClaimDetailPage;
