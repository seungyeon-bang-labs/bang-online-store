'use client';

import type { ReactNode } from 'react';
import { useCartState } from '@/features/cart/use-cart';
import { selectCartItemCount, selectCartNeedsCheck } from '@/features/cart/cart-count';
import { Header } from '@/shared/components/layout/header';

interface CartAwareHeaderProps {
  mobileContent?: ReactNode;
  isLoggedIn?: boolean;
  logoutControl?: ReactNode;
}

export function CartAwareHeader({ mobileContent, isLoggedIn, logoutControl }: CartAwareHeaderProps) {
  const cartItemCount = useCartState(selectCartItemCount);
  const cartNeedsCheck = useCartState(selectCartNeedsCheck);

  return (
    <Header
      mobileContent={mobileContent}
      cartItemCount={cartItemCount}
      cartNeedsCheck={cartNeedsCheck}
      isLoggedIn={isLoggedIn}
      logoutControl={logoutControl}
    />
  );
}
