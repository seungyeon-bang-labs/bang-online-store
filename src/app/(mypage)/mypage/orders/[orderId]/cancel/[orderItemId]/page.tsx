import { MypageFormCard, MypageFormUnavailable } from '@/features/mypage/common';
import { notFound } from 'next/navigation';
import { currentUserRepository } from '@/domains/member';
import { getOrderCancellationRequestViewModel } from '@/domains/order';
import {
  MypageOrderCancellationFlow,
} from '@/features/mypage/orders/cancel';
import {
  getMypageCancelledOrderListHref,
  getMypageOrderDetailHref,
  resolveMypageOrderCancellationReturnHref,
} from '@/shared/lib/mypage-routes';
import { submitMypageOrderCancellationAction } from './actions';

interface OrderCancellationPageProps {
  params: Promise<{ orderId: string; orderItemId: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}

async function OrderCancellationPage({
  params,
  searchParams,
}: OrderCancellationPageProps) {
  const [{ orderId, orderItemId }, { returnTo }, user] = await Promise.all([
    params,
    searchParams,
    currentUserRepository.findCurrent(),
  ]);
  const cancellationRequestViewModel = user
    ? await getOrderCancellationRequestViewModel(
        user.id,
        orderId,
        orderItemId,
      )
    : null;

  if (!cancellationRequestViewModel) notFound();

  const returnHref = resolveMypageOrderCancellationReturnHref(
    orderId,
    returnTo,
  );
  return (
    <MypageFormCard title="주문 취소 신청">
      {cancellationRequestViewModel.isEligible ? (
        <MypageOrderCancellationFlow
          preview={cancellationRequestViewModel.preview}
          returnHref={returnHref}
          onSubmitCancellation={submitMypageOrderCancellationAction}
        />
      ) : (
        <MypageFormUnavailable
          title="주문 취소를 신청할 수 없습니다."
          description={
            cancellationRequestViewModel.unavailableReason === 'already_cancelled'
              ? '이미 취소가 신청되었거나 취소 처리가 완료된 상품입니다.'
              : '현재 주문 상태에서는 주문 취소를 신청할 수 없습니다.'
          }
          action={{
            href:
              cancellationRequestViewModel.unavailableReason ===
              'already_cancelled'
                ? getMypageCancelledOrderListHref()
                : getMypageOrderDetailHref(orderId),
            label:
              cancellationRequestViewModel.unavailableReason ===
              'already_cancelled'
                ? '주문 내역으로'
                : '주문 상세로',
          }}
        />
      )}
    </MypageFormCard>
  );
}

export default OrderCancellationPage;
