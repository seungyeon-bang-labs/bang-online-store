import { getCartItemCount } from '@/domains/cart';
import type { CartState } from './cart-store';

// Adds still waiting for the cart list count at once, so the header rises when the button is pressed.
// Null (still checking) only while loading; a settled cart with nothing to show counts as 0.
export function selectCartItemCount(state: CartState): number | null {
  if (state.phase === 'loading') return null;
  if (!state.cart || state.phase === 'restricted') return 0;
  return getCartItemCount(state.cart.items) + state.pendingAdd;
}

// One request at a time; before any cart was shown only retry is possible.
export function selectCartLocked(state: CartState): boolean {
  return state.busy || state.phase === 'loading' || state.phase === 'restricted' || (state.phase === 'error' && state.cart === null);
}
