import { notFound } from 'next/navigation';
import { currentUserRepository } from '@/domains/member';
import { getOrderCancellationPreviewViewModel } from '@/domains/order';
import { MypageOrderCancellationFlow } from '@/features/mypage/orders/cancel';
import { resolveMypageOrderCancellationReturnHref } from '@/shared/lib/mypage-routes';

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
  const cancellationPreviewViewModel = user
    ? await getOrderCancellationPreviewViewModel(
        user.id,
        orderId,
        orderItemId,
      )
    : null;

  if (!cancellationPreviewViewModel) notFound();

  const returnHref = resolveMypageOrderCancellationReturnHref(
    orderId,
    returnTo,
  );

  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="border-b border-zinc-300 px-4 py-4 md:px-5">
        <h2 className="text-xl font-black tracking-tight text-black">
          주문 취소 신청
        </h2>
      </header>
      <MypageOrderCancellationFlow
        preview={cancellationPreviewViewModel}
        returnHref={returnHref}
      />
    </article>
  );
}

export default OrderCancellationPage;
