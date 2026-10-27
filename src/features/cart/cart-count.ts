import { getCartItemCount } from '@/domains/cart';
import type { CartState } from '@/domains/cart/cart.store';

// Keep the last confirmed count while the same cart changes or syncs; an account change clears the cart first.
const countable: ReadonlySet<CartState['phase']> = new Set(['ready', 'mutating', 'syncing', 'restoring']);

export function selectCartItemCount(state: CartState): number | null {
  // A request awaiting the user's retry keeps the last confirmed count, shown with a check label.
  const visible = countable.has(state.phase) || (state.phase === 'retryable' && state.unresolved);
  return state.cart && visible ? getCartItemCount(state.cart.items) : null;
}

// Only for a confirmed member; while the account is unknown the previous account's state stays hidden.
export function selectCartNeedsCheck(state: CartState): boolean {
  return state.access?.status === 'member' && state.unresolved;
}
