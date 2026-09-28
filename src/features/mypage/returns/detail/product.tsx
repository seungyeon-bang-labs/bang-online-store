import type {
  OrderClaimDetailReturnProductViewModel,
  OrderClaimProductViewModel,
} from '@/domains/order/claim/view-model';
import { MypageCard } from '@/features/mypage/common';
import {
  MypageProductSummary,
  MypageProductThumbnailLink,
} from '@/features/mypage/common/product-summary';

interface MypageClaimDetailProductProps {
  product: OrderClaimDetailReturnProductViewModel;
}

export function MypageClaimDetailProduct({
  product,
}: MypageClaimDetailProductProps) {
  return (
    <MypageCard.Collapsible title={product.title}>
      <MypageCard.Body>
        <MypageClaimDetailProductContent item={product.item} />
      </MypageCard.Body>
    </MypageCard.Collapsible>
  );
}

interface MypageClaimDetailProductContentProps {
  item: OrderClaimProductViewModel;
  className?: string;
  isMuted?: boolean;
}

export function MypageClaimDetailProductContent({
  item,
  className,
  isMuted = false,
}: MypageClaimDetailProductContentProps) {
  return (
    <MypageProductSummary
      className={className}
      thumbnail={
        <MypageProductThumbnailLink
          href={item.product.href}
          src={item.product.thumbnailUrl}
          alt={item.productName}
        />
      }
      name={item.productName}
      nameHref={item.product.href}
      meta={`${item.optionLabel} · ${item.quantity}개`}
      amount={item.lineTotalText}
      tone={isMuted ? 'muted' : 'normal'}
      amountTone={isMuted ? 'muted' : 'normal'}
    />
  );
}
