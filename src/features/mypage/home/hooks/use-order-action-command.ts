'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useCartCommands } from '@/features/cart/use-cart';
import type { MypageHomeOrderCommandAction } from '@/domains/mypage';
import { getCartHref } from '@/shared/lib/cart-routes';

export function useOrderActionCommand() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addItems } = useCartCommands();

  // The cart takes one add at a time (a second click is ignored) and reports a failure itself; success waits until saved.
  return (action: MypageHomeOrderCommandAction) => {
    addItems([action.cartItem], () => {
      toast.success('상품을 장바구니에 다시 담았습니다.', {
        position: 'bottom-center',
        duration: 3000,
        action: {
          label: '보러가기',
          onClick: () => {
            const search = searchParams.toString();
            router.push(getCartHref(search ? `${pathname}?${search}` : pathname));
          },
        },
      });
    });
  };
}
