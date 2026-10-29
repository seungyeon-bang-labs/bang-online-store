import { createStore } from 'zustand/vanilla';
import type { CartAccess } from '@/domains/cart/contract';
import type { CartViewModel } from '@/domains/cart/view-model';
import { reconcileSelection } from '@/domains/cart/domain';

export type CartPhase = 'loading' | 'ready' | 'error' | 'restricted';

export type CartState = {
  phase: CartPhase;
  access: CartAccess | null;
  cart: CartViewModel | null;
  // A server request (or guest product load) is in flight; only one runs at a time.
  busy: boolean;
  // Quantity of adds not yet shown in the cart list.
  pendingAdd: number;
  selectedIds: readonly string[];
  // Shown while phase is error or restricted.
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
    phase: 'loading',
    access: null,
    cart: null,
    busy: false,
    pendingAdd: 0,
    selectedIds: [],
    message: null,
    setStateFromController: next =>
      set(state => {
        const cart = next.cart === undefined ? state.cart : next.cart;
        return {
          ...next,
          selectedIds: reconcileSelection(
            next.selectedIds ?? state.selectedIds,
            cart?.items ?? [],
            next.cart?.operation?.itemIdMap,
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
