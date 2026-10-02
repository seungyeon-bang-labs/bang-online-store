'use client';

import type { ReactNode } from 'react';
import { getCartItemCount, useCartStore } from '@/domains/cart';
import { Header } from '@/shared/components/layout/header';

interface CartAwareHeaderProps {
  mobileContent?: ReactNode;
}

export function CartAwareHeader({ mobileContent }: CartAwareHeaderProps) {
  const cartItemCount = useCartStore(state => getCartItemCount(state.items));

  return (
    <Header mobileContent={mobileContent} cartItemCount={cartItemCount} />
  );
}
