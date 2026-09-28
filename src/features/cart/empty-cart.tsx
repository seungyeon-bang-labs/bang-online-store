import { ShoppingCart } from 'lucide-react';
import { ButtonLink } from '@/shared/components/ui/button';

interface EmptyCartProps {
  isEmpty: boolean;
}

export function EmptyCart({ isEmpty }: EmptyCartProps) {
  return (
    isEmpty && (
      <div className="rounded-md border-2 border-dashed border-gray-200 py-16 text-center md:py-27">
        <ShoppingCart className="size-12 mx-auto mb-4 text-gray-400" />
        <p className="font-black text-gray-400 uppercase tracking-widest">
          장바구니에 담긴 상품이 없습니다.
        </p>

        <ButtonLink href="/" size="lg" className="mt-8">
          쇼핑 계속하기
        </ButtonLink>
      </div>
    )
  );
}
