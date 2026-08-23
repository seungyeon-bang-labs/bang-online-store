import type { OrderClaimDetailInformationViewModel } from '@/domains/order/claim/view-model';

interface MypageClaimDetailHeaderProps {
  information: OrderClaimDetailInformationViewModel;
}

export function MypageClaimDetailHeader({
  information,
}: MypageClaimDetailHeaderProps) {
  return (
    <section className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <dl className="space-y-3 p-4 text-sm md:space-y-1 md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <dt className="shrink-0 font-medium text-zinc-500">주문 번호</dt>
          <dd className="ml-auto w-fit max-w-full shrink-0 break-all text-right font-black text-black">
            {information.orderNumber}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <dt className="shrink-0 font-medium text-zinc-500">신청일</dt>
          <dd className="ml-auto w-fit max-w-full shrink-0 text-right font-bold text-black">
            {information.requestedAt}
          </dd>
        </div>
        {information.completedAt ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="shrink-0 font-medium text-zinc-500">완료일</dt>
            <dd className="ml-auto w-fit max-w-full shrink-0 text-right font-bold text-black">
              {information.completedAt}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
