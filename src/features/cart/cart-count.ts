import { getCartItemCount } from '@/domains/cart';
import type { CartState } from '@/domains/cart/cart.store';

// Keep the last confirmed count while the same cart changes or syncs; an account change clears the cart first.
const countable: ReadonlySet<CartState['phase']> = new Set(['ready', 'mutating', 'syncing', 'restoring']);

export function selectCartItemCount(state: CartState): number | null {
  return state.cart && countable.has(state.phase) ? getCartItemCount(state.cart.items) : null;
}
