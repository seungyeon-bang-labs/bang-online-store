import { createStore } from 'zustand/vanilla';
import type { CartAccess, CartOperationResult } from './cart.contract';
import type { CartViewModel } from './cart.view-model';
import { reconcileSelection } from './cart.rules';

export type CartState = {
  phase:
    | 'checking'
    | 'restoring'
    | 'syncing'
    | 'ready'
    | 'mutating'
    | 'retryable'
    | 'restricted';
  access: CartAccess | null;
  cart: CartViewModel | null;
  selectedIds: readonly string[];
  settledRequests: Readonly<Record<string, CartOperationResult>>;
  // The current member has a request whose server outcome is still unknown.
  unresolved: boolean;
  // Lines of a rejected login merge held for the current member.
  heldCount: number;
  message: string | null;
};

export type CartSelectionCommands = {
  setSelected(id: string, checked: boolean): void;
  selectAll(checked: boolean): void;
};

export function createCartStore() {
  // Settled results belong to an account identity; access states (restricted, error, unknown) are not one.
  let settledOwner: string | null = null;
  return createStore<
    CartState &
      CartSelectionCommands & {
        setStateFromController(next: Partial<CartState>): void;
      }
  >((set, get) => ({
    phase: 'checking',
    access: null,
    cart: null,
    selectedIds: [],
    message: null,
    settledRequests: {},
    unresolved: false,
    heldCount: 0,
    setStateFromController: next =>
      set(state => {
        const cart = next.cart === undefined ? state.cart : next.cart;
        const identity = next.access?.status === 'member' ? `member:${next.access.userId}` : next.access?.status === 'guest' ? 'guest' : null;
        // A different account clears its results in this same update, so no reader sees the new owner with old results.
        const changed = identity !== null && identity !== settledOwner;
        if (changed) settledOwner = identity;
        const settled = next.settledRequests ?? (changed ? {} : state.settledRequests);
        const settledRequests = next.cart?.operation
          ? { ...settled, [next.cart.operation.requestId]: next.cart.operation }
          : settled;
        return {
          ...(changed ? { unresolved: false, heldCount: 0 } : {}),
          ...next,
          settledRequests,
          selectedIds: reconcileSelection(
            next.selectedIds ?? state.selectedIds,
            cart?.items ?? [],
          ),
        };
      }),
    setSelected: (id, checked) => {
      const state = get();
      if (state.phase !== 'ready') return;
      set({
        selectedIds: reconcileSelection(
          checked
            ? [...state.selectedIds, id]
            : state.selectedIds.filter(value => value !== id),
          state.cart?.items ?? [],
        ),
      });
    },
    selectAll: checked => {
      const state = get();
      if (state.phase !== 'ready') return;
      set({
        selectedIds: checked
          ? reconcileSelection(
              state.cart?.items.map(item => item.id) ?? [],
              state.cart?.items ?? [],
            )
          : [],
      });
    },
  }));
}
