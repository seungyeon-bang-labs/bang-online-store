import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { OrderClaimViewModel } from '@/domains/order/claim/view-model';
import { MypageCard, MypageCardContentBlock } from '@/features/mypage/common';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';
import { getMypageOrderClaimDetailHref } from '@/shared/lib/mypage-routes';
import { MypageBadge } from '../common/badge';
import { MYPAGE_LIST_CARD_HEADER_CLASS_NAME } from '../common/styles';
import { MypageClaimCancelButton } from './cancel-button';

interface MypageClaimCardProps {
  claim: OrderClaimViewModel;
  cancelOrderClaimAction: (claimId: string) => Promise<boolean>;
}

export function MypageClaimCard({
  claim,
  cancelOrderClaimAction,
}: MypageClaimCardProps) {
  return (
    <MypageCard as="article">
      <MypageCard.Header className={MYPAGE_LIST_CARD_HEADER_CLASS_NAME}>
        <div className="flex items-center gap-2 justify-self-start">
          <MypageBadge {...claim.type} size="responsive" />
          <MypageBadge {...claim.status} size="responsive" />
        </div>
        <p className="col-start-1 row-start-2 min-w-0 truncate pl-2 text-xs font-bold text-zinc-700 md:col-span-1 md:col-start-2 md:row-start-1 md:pl-0 md:text-sm md:font-black md:text-black">
          {claim.statusDescription}
        </p>
        <Link
          href={getMypageOrderClaimDetailHref(claim.id)}
          className="col-start-2 row-span-2 row-start-1 inline-flex min-h-10 items-center justify-self-end gap-0.5 whitespace-nowrap text-sm font-bold text-black hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black md:col-start-3 md:row-span-1 md:min-h-0"
        >
          상세 보기
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </MypageCard.Header>

      <MypageCard.Body
        className={claim.actions.canCancel ? 'pb-0 md:pb-0' : undefined}
      >
        <MypageProductSummary
          thumbnail={
            <MypageProductThumbnailLink
              href={claim.product.href}
              src={claim.product.thumbnailUrl}
              alt={claim.productName}
            />
          }
          name={claim.productName}
          nameHref={claim.product.href}
          meta={claim.optionLabel}
          amount={claim.lineTotalText}
        />
        <MypageCardContentBlock
          title="신청 사유"
          variant="inline"
          className="mt-4"
          right={
            claim.refundAmount ? (
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="text-xs font-medium text-zinc-500">
                  {claim.refundAmount.label}
                </span>
                <span className="text-sm font-black text-red-700">
                  {claim.refundAmount.amountText}
                </span>
              </div>
            ) : undefined
          }
        >
          {claim.reason}
        </MypageCardContentBlock>
      </MypageCard.Body>
      {claim.actions.canCancel ? (
        <MypageCard.Footer>
          <MypageClaimCancelButton
            claimId={claim.id}
            cancelOrderClaimAction={cancelOrderClaimAction}
          />
        </MypageCard.Footer>
      ) : null}
    </MypageCard>
  );
}
