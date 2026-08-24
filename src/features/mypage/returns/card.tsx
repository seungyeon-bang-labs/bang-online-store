import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { OrderClaimViewModel } from '@/domains/order/claim/view-model';
import { getMypageOrderClaimDetailHref } from '@/shared/lib/mypage-routes';
import { MypageStatusBadge } from '../common/status-badge';
import { MypageClaimCardInformation } from './card-information';
import { MypageClaimCardProduct } from './card-product';

interface MypageClaimCardProps {
  claim: OrderClaimViewModel;
}

export function MypageClaimCard({ claim }: MypageClaimCardProps) {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-300 bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 p-4 md:p-5">
        <MypageStatusBadge {...claim.status} size="large" />
        <Link
          href={getMypageOrderClaimDetailHref(claim.id)}
          className="inline-flex items-center gap-0.5 whitespace-nowrap text-sm font-bold text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          상세 보기
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      <MypageClaimCardProduct
        product={claim.product}
        productName={claim.productName}
        optionLabel={claim.optionLabel}
        lineTotalText={claim.lineTotalText}
      />
      <MypageClaimCardInformation
        reason={claim.reason}
        requestedAt={claim.requestedAt}
        completedAt={claim.completedAt}
      />
    </article>
  );
}
