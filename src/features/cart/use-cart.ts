'use client';

import { useContext } from 'react';
import { useStore } from 'zustand';
import type { CartState } from './cart-store';
import { CartContext, type CartCommands } from './cart-provider';

export type { CartCommands };

export function useCartState<T>(selector: (state: CartState) => T): T {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartState는 CartProvider 안에서 사용해야 합니다.');
  return useStore(context.state, selector);
}

export function useCartCommands(): CartCommands {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCartCommands는 CartProvider 안에서 사용해야 합니다.');
  return context.commands;
}
