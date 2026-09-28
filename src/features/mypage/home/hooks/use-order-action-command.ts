'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useCartStore } from '@/domains/cart';
import type { MypageHomeOrderCommandAction } from '@/domains/mypage';
import { getCartHref } from '@/shared/lib/cart-routes';

export function useOrderActionCommand() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const addToCart = useCartStore(state => state.addToCart);

  return (action: MypageHomeOrderCommandAction) => {
    addToCart(
      action.cartItem.productId,
      action.cartItem.variantId,
      action.cartItem.quantity,
    );
    toast.success('상품을 장바구니에 다시 담았습니다.', {
      position: 'bottom-center',
    });
    const search = searchParams.toString();
    router.push(getCartHref(search ? `${pathname}?${search}` : pathname));
  };
}
