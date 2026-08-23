import type { OrderClaimDetailViewModel } from '@/domains/order/claim/view-model';
import { MypageClaimDetailAddress } from './address';
import { MypageClaimDetailExchangeProductComparison } from './exchange-product-comparison';
import { MypageClaimDetailHeader } from './header';
import { MypageClaimDetailProcessingHistory } from './processing-history';
import { MypageClaimDetailProduct } from './product';
import { MypageClaimDetailRejectionNotice } from './rejection-notice';
import { MypageClaimDetailRefundInformation } from './refund-information';
import { MypageClaimDetailRequestInformation } from './request-information';

interface MypageClaimDetailProps {
  detail: OrderClaimDetailViewModel;
}

export function MypageClaimDetail({ detail }: MypageClaimDetailProps) {
  const {
    information,
    request,
    rejectionNotice,
    processingHistory,
    product,
    address,
    refund,
  } = detail;

  return (
    <div className="space-y-4">
      <MypageClaimDetailHeader information={information} />
      <MypageClaimDetailRequestInformation request={request} />
      {rejectionNotice ? (
        <MypageClaimDetailRejectionNotice notice={rejectionNotice} />
      ) : null}
      <MypageClaimDetailProcessingHistory
        processingHistory={processingHistory}
      />
      {product.kind === 'exchange' ? (
        <MypageClaimDetailExchangeProductComparison product={product} />
      ) : (
        <MypageClaimDetailProduct product={product} />
      )}
      <MypageClaimDetailAddress address={address} />
      {refund ? <MypageClaimDetailRefundInformation refund={refund} /> : null}
    </div>
  );
}
