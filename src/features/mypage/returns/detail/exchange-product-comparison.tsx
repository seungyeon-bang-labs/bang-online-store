import { ArrowDown, ArrowRight } from 'lucide-react';
import type { OrderClaimDetailExchangeProductViewModel } from '@/domains/order/claim/view-model';
import { MypageCard } from '@/features/mypage/common';
import { MypageClaimDetailProductContent } from './product';

interface MypageClaimDetailExchangeProductComparisonProps {
  product: OrderClaimDetailExchangeProductViewModel;
}

export function MypageClaimDetailExchangeProductComparison({
  product,
}: MypageClaimDetailExchangeProductComparisonProps) {
  return (
    <MypageCard.Collapsible title="교환 전·후 상품">
      <div className="md:hidden">
        <ProductPanel item={product.orderedItem} isMuted />
        <div className="flex items-center justify-center gap-2 border-y border-zinc-200 py-3 text-sm font-bold text-black">
          <ArrowDown className="size-5" aria-hidden="true" />
          교환 요청
        </div>
        <ProductPanel item={product.exchangeItem} />
      </div>
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch md:grid">
        <ProductPanel item={product.orderedItem} isMuted />
        <div className="flex min-w-24 flex-col items-center justify-center gap-2 border-x border-zinc-200 px-4 text-sm font-bold text-black">
          <ArrowRight className="size-5" aria-hidden="true" />
          교환 요청
        </div>
        <ProductPanel item={product.exchangeItem} />
      </div>
    </MypageCard.Collapsible>
  );
}

interface ProductPanelProps {
  item: OrderClaimDetailExchangeProductViewModel['orderedItem'];
  isMuted?: boolean;
}

function ProductPanel({ item, isMuted = false }: ProductPanelProps) {
  return (
    <div className="bg-white">
      <MypageClaimDetailProductContent
        item={item}
        isMuted={isMuted}
        className="p-4 md:p-5"
      />
    </div>
  );
}
