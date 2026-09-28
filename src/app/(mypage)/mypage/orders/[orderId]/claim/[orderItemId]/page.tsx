import { MypageFormCard, MypageFormUnavailable } from '@/features/mypage/common';
import { notFound } from 'next/navigation';
import { getOrderClaimRequestViewModel } from '@/domains/order';
import { currentUserRepository } from '@/domains/member';
import {
  MypageClaimRequestFlow,
} from '@/features/mypage/returns/request';
import type { OrderClaimRequestUnavailableReason } from '@/domains/order/claim/domain';
import {
  getMypageOrderClaimListHref,
  resolveMypageOrderClaimRequestReturnHref,
} from '@/shared/lib/mypage-routes';

const CLAIM_REQUEST_UNAVAILABLE_COPY: Record<
  OrderClaimRequestUnavailableReason,
  string
> = {
  not_delivered: '배송 완료된 상품만 교환 또는 반품을 신청할 수 있습니다.',
  expired: '상품 수령 후 14일 이내에만 교환 또는 반품을 신청할 수 있습니다.',
  cancelled: '취소된 상품은 교환 또는 반품을 신청할 수 없습니다.',
  already_claimed: '이미 교환 또는 반품이 접수된 상품입니다.',
};

interface OrderClaimRequestPageProps {
  params: Promise<{ orderId: string; orderItemId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}

async function OrderClaimRequestPage({
  params,
  searchParams,
}: OrderClaimRequestPageProps) {
  const [{ orderId, orderItemId }, { returnTo }, user] = await Promise.all([
    params,
    searchParams,
    currentUserRepository.findCurrent(),
  ]);
  const claimRequestViewModel = user
    ? await getOrderClaimRequestViewModel(user.id, orderId, orderItemId)
    : null;

  if (!claimRequestViewModel) notFound();

  const isAlreadyClaimed =
    claimRequestViewModel.unavailableReason === 'already_claimed';

  return (
    <MypageFormCard title="교환·반품 신청">
      {claimRequestViewModel.isEligible ? (
        <MypageClaimRequestFlow
          claimRequest={claimRequestViewModel}
          returnHref={resolveMypageOrderClaimRequestReturnHref(
            orderId,
            returnTo,
          )}
        />
      ) : (
        <MypageFormUnavailable
          title="교환·반품을 신청할 수 없습니다."
          description={
            claimRequestViewModel.unavailableReason
              ? CLAIM_REQUEST_UNAVAILABLE_COPY[
                  claimRequestViewModel.unavailableReason
                ]
              : '주문 상세에서 상품을 다시 선택해 주세요.'
          }
          action={{
            href: isAlreadyClaimed
              ? getMypageOrderClaimListHref()
              : `/mypage/orders/${claimRequestViewModel.orderId}`,
            label: isAlreadyClaimed ? '교환·반품 내역으로' : '주문 상세로',
          }}
        />
      )}
    </MypageFormCard>
  );
}

export default OrderClaimRequestPage;
