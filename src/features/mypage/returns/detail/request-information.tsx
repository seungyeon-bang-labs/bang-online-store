import type { OrderClaimDetailRequestViewModel } from '@/domains/order/claim/view-model';
import { MypageClaimDetailCollapsibleCard } from './collapsible-card';

interface MypageClaimDetailRequestInformationProps {
  request: OrderClaimDetailRequestViewModel;
}

export function MypageClaimDetailRequestInformation({
  request,
}: MypageClaimDetailRequestInformationProps) {
  return (
    <MypageClaimDetailCollapsibleCard title="요청 내용">
      <dl className="space-y-3 p-4 text-sm md:space-y-1 md:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <dt className="shrink-0 font-bold text-zinc-500">유형</dt>
          <dd className="ml-auto w-fit max-w-full shrink-0 text-right font-bold text-black">
            {request.type.label}
          </dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <dt className="shrink-0 font-bold text-zinc-500">신청 사유</dt>
          <dd className="ml-auto w-fit max-w-full shrink-0 text-right font-bold text-black">
            {request.reason}
          </dd>
        </div>
        {request.description ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="shrink-0 font-bold text-zinc-500">신청 상세 사유</dt>
            <dd className="ml-auto w-fit max-w-full shrink-0 whitespace-pre-wrap wrap-break-word text-right font-bold leading-relaxed text-black">
              {request.description}
            </dd>
          </div>
        ) : null}
      </dl>
    </MypageClaimDetailCollapsibleCard>
  );
}
