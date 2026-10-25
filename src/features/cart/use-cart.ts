'use client';

import { useContext } from 'react';
import { useStore } from 'zustand';
import type { CartState } from '@/domains/cart/cart.store';
import { CartContext } from './cart-provider';

export function useCartState<T>(selector: (state: CartState) => T): T {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartState는 CartProvider 안에서 사용해야 합니다.');
  return useStore(context.state, selector);
}

export function useCartCommands() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartCommands는 CartProvider 안에서 사용해야 합니다.');
  return context.commands;
}
