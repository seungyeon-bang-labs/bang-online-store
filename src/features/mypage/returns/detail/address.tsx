import type { OrderClaimDetailAddressViewModel } from '@/domains/order/claim/view-model';
import { MypageClaimDetailCollapsibleCard } from './collapsible-card';

interface MypageClaimDetailAddressProps {
  address: OrderClaimDetailAddressViewModel;
}

export function MypageClaimDetailAddress({
  address,
}: MypageClaimDetailAddressProps) {
  return (
    <MypageClaimDetailCollapsibleCard title={address.title}>
      <div className="p-4 md:p-5">
        <dl className="space-y-3 text-sm md:space-y-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="shrink-0 font-bold text-zinc-500">이름</dt>
            <dd className="ml-auto w-fit max-w-full shrink-0 text-right font-bold text-black">
              {address.contactName}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="shrink-0 font-bold text-zinc-500">연락처</dt>
            <dd className="ml-auto w-fit max-w-full shrink-0 text-right font-bold text-black">
              {address.contactPhone}
            </dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <dt className="shrink-0 font-bold text-zinc-500">주소</dt>
            <dd className="ml-auto w-fit max-w-full shrink-0 wrap-break-word text-right font-bold leading-relaxed text-black">
              {address.addressText}{' '}
              <span className="whitespace-nowrap text-zinc-500">
                ({address.postalCode})
              </span>
            </dd>
          </div>
        </dl>
        {address.description ? (
          <p className="mt-3 text-sm font-medium text-zinc-500">
            {address.description}
          </p>
        ) : null}
      </div>
    </MypageClaimDetailCollapsibleCard>
  );
}
