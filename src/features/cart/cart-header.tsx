'use client';

import type { ReactNode } from 'react';
import { getCartItemCount, useCartStore } from '@/domains/cart';
import { Header } from '@/shared/components/layout/header';
import { MainMobileHeader } from '@/shared/components/layout/main-mobile-header';

interface CartAwareHeaderProps {
  mobileContent?: ReactNode;
}

export function CartAwareHeader({ mobileContent }: CartAwareHeaderProps) {
  const cartItemCount = useCartStore(state => getCartItemCount(state.items));

  return (
    <Header mobileContent={mobileContent} cartItemCount={cartItemCount} />
  );
}

export function CartAwareMainMobileHeader() {
  const cartItemCount = useCartStore(state => getCartItemCount(state.items));

  return <MainMobileHeader cartItemCount={cartItemCount} />;
}
