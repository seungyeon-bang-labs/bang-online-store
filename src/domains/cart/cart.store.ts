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
  message: string | null;
};

export type CartSelectionCommands = {
  setSelected(id: string, checked: boolean): void;
  selectAll(checked: boolean): void;
};

export function createCartStore() {
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
    setStateFromController: next =>
      set(state => {
        const cart = next.cart === undefined ? state.cart : next.cart;
        const settled = next.settledRequests ?? state.settledRequests;
        // Only an explicit cart reset (account change) forgets settled results; a still-empty initial sync keeps them.
        const settledRequests =
          next.cart === null
            ? {}
            : next.cart?.operation
              ? {
                  ...settled,
                  [next.cart.operation.requestId]: next.cart.operation,
                }
              : settled;
        return {
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
