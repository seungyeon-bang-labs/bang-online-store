import type { OrderClaimViewModel } from '@/domains/order';
import { MypageStatusBadge } from './mypage-status-badge';

export function MypageClaimList({
  claims,
}: {
  claims: OrderClaimViewModel[];
}) {
  return (
    <div className="space-y-4">
      {claims.map(claim => (
        <article
          key={claim.id}
          className="rounded-md border border-zinc-300 bg-white p-5 md:p-6"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <MypageStatusBadge {...claim.type} />
              <MypageStatusBadge {...claim.status} />
            </div>
            <p className="text-xs font-medium text-zinc-400">
              {claim.orderNumber}
            </p>
          </header>
          <div className="pt-4">
            <h3 className="font-black text-black">{claim.productName}</h3>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              {claim.optionLabel}
            </p>
            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-bold text-zinc-400">사유</dt>
                <dd className="mt-1 font-bold text-zinc-700">
                  {claim.reason}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-zinc-400">요청일</dt>
                <dd className="mt-1 font-bold text-zinc-700">
                  {claim.requestedAt}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-zinc-400">완료일</dt>
                <dd className="mt-1 font-bold text-zinc-700">
                  {claim.completedAt ?? '-'}
                </dd>
              </div>
            </dl>
          </div>
        </article>
      ))}
    </div>
  );
}
