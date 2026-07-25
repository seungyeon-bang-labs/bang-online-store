'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCartStore } from '@/domains/cart';
import type { MypageHomeOrderCommandAction } from '@/domains/mypage';

export function useOrderActionCommand() {
  const router = useRouter();
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
    router.push('/cart');
  };
}
