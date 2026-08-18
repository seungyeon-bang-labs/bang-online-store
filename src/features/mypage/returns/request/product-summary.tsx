import Image from 'next/image';
import Link from 'next/link';
import type { OrderClaimRequestViewModel } from '@/domains/order/view-model';

type ClaimRequestProductSummary = Pick<
  OrderClaimRequestViewModel,
  'itemAmountText' | 'optionLabel' | 'product' | 'productName' | 'quantity'
>;

interface MypageClaimRequestProductSummaryProps {
  claimRequest: ClaimRequestProductSummary;
}

export function MypageClaimRequestProductSummary({
  claimRequest,
}: MypageClaimRequestProductSummaryProps) {
  return (
    <section
      className="border-t border-zinc-300 p-4 md:p-5"
      aria-labelledby="claim-request-product-title"
    >
      <h2 id="claim-request-product-title" className="sr-only">
        교환·반품 신청 상품
      </h2>
      <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 md:grid-cols-[88px_minmax(0,1fr)]">
        <Link
          href={claimRequest.product.href}
          className="relative aspect-square overflow-hidden rounded-sm bg-zinc-100"
        >
          <Image
            src={claimRequest.product.thumbnailUrl}
            alt={claimRequest.productName}
            fill
            sizes="(max-width: 768px) 72px, 88px"
            className="object-cover"
          />
        </Link>
        <div className="min-w-0 self-start">
          <Link
            href={claimRequest.product.href}
            className="block truncate font-black text-black hover:underline"
          >
            {claimRequest.productName}
          </Link>
          <p className="mt-0.5 text-sm font-medium text-zinc-500">
            {claimRequest.optionLabel} · {claimRequest.quantity}개
          </p>
          <p className="mt-1 text-sm font-black text-black">
            {claimRequest.itemAmountText}
          </p>
        </div>
      </div>
    </section>
  );
}
