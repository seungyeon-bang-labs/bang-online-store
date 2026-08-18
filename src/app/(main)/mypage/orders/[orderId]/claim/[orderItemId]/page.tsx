import { notFound } from 'next/navigation';
import { getOrderClaimRequestViewModel } from '@/domains/order';
import { currentUserRepository } from '@/domains/member';
import {
  MypageClaimRequestFlow,
  MypageClaimRequestUnavailable,
} from '@/features/mypage/returns/request';

interface OrderClaimRequestPageProps {
  params: Promise<{ orderId: string; orderItemId: string }>;
}

async function OrderClaimRequestPage({ params }: OrderClaimRequestPageProps) {
  const [{ orderId, orderItemId }, user] = await Promise.all([
    params,
    currentUserRepository.findCurrent(),
  ]);
  const claimRequestViewModel = user
    ? await getOrderClaimRequestViewModel(user.id, orderId, orderItemId)
    : null;

  if (!claimRequestViewModel) notFound();

  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-300 px-4 py-4 md:px-5">
        <h2 className="text-xl font-black tracking-tight text-black">
          교환·반품 신청
        </h2>
      </header>
      {claimRequestViewModel.isEligible ? (
        <MypageClaimRequestFlow claimRequest={claimRequestViewModel} />
      ) : (
        <MypageClaimRequestUnavailable
          orderId={claimRequestViewModel.orderId}
          reason={claimRequestViewModel.unavailableReason}
        />
      )}
    </article>
  );
}

export default OrderClaimRequestPage;
