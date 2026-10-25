'use client';

import { useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useCartState, useCartCommands } from '@/features/cart/use-cart';
import type { MypageHomeOrderCommandAction } from '@/domains/mypage';
import { getCartHref } from '@/shared/lib/cart-routes';

export function useOrderActionCommand() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addItems } = useCartCommands();
  const phase = useCartState(state => state.phase);
  // Home buttons stay enabled, so a second click during an add must not start another one.
  const inFlight = useRef(false);

  return async (action: MypageHomeOrderCommandAction) => {
    if (inFlight.current) return;
    if (phase !== 'ready') { toast.info('장바구니를 먼저 확인해주세요.'); return; }
    inFlight.current = true;
    try {
      const reply = await addItems([action.cartItem]);
      if (reply.status !== 'ok') {
        toast.error('message' in reply ? reply.message : '장바구니 계정이 변경되었습니다.');
        return;
      }
      if (reply.cart.operation?.outcome === 'rejected') {
        if (!reply.cart.notices.length) toast.info('현재 이 상품을 다시 담을 수 없습니다.');
        return;
      }
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
    } catch { toast.error('장바구니 요청을 확인하지 못했습니다. 다시 시도해주세요.'); }
    finally { inFlight.current = false; }
  };
}
