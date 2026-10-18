import { create } from 'zustand';
import type { CartProductRequestItem } from './cart.api';

export interface CartItem {
  productId: number;
  variantId: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  selectedIds: number[];
  addToCart: (productId: number, variantId: number, quantity?: number) => void;
  updateQuantity: (variantId: number, quantity: number) => void;
  updateOption: (
    currentVariantId: number,
    nextProductId: number,
    nextVariantId: number,
  ) => void;
  setSelectedIds: (variantIds: number[]) => void;
  toggleSelected: (variantId: number, selected: boolean) => void;
  selectAll: (variantIds: number[]) => void;
  removeFromCart: (variantId: number) => void;
  reconcileItems: (
    requestedItems: readonly CartItem[],
    availableItems: readonly CartProductRequestItem[],
  ) => number;
  clearCart: () => void;
}

export const useCartStore = create<CartState>(set => ({
  items: [],
  selectedIds: [],
  addToCart: (productId, variantId, quantity = 1) =>
    set(state => {
      const existingItemIndex = state.items.findIndex(
        item => item.variantId === variantId,
      );

      const nextSelectedIds = new Set(state.selectedIds);
      nextSelectedIds.add(variantId);

      if (existingItemIndex !== -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += quantity;
        return { items: updatedItems, selectedIds: Array.from(nextSelectedIds) };
      }

      return {
        items: [...state.items, { productId, variantId, quantity }],
        selectedIds: Array.from(nextSelectedIds),
      };
    }),
  updateQuantity: (variantId, quantity) =>
    set(state => {
      if (quantity <= 0) {
        return {
          items: state.items.filter(item => item.variantId !== variantId),
          selectedIds: state.selectedIds.filter(id => id !== variantId),
        };
      }

      return {
        items: state.items.map(item =>
          item.variantId === variantId ? { ...item, quantity } : item,
        ),
      };
    }),
  updateOption: (currentVariantId, nextProductId, nextVariantId) =>
    set(state => {
      if (currentVariantId === nextVariantId) {
        return {
          items: state.items.map(item =>
            item.variantId === currentVariantId
              ? { ...item, productId: nextProductId }
              : item,
          ),
        };
      }

      const currentItem = state.items.find(
        item => item.variantId === currentVariantId,
      );
      if (!currentItem) return {};

      const existingIndex = state.items.findIndex(
        item => item.variantId === nextVariantId,
      );

      let nextItems = state.items.filter(
        item => item.variantId !== currentVariantId,
      );

      if (existingIndex !== -1) {
        nextItems = nextItems.map(item =>
          item.variantId === nextVariantId
            ? { ...item, quantity: item.quantity + currentItem.quantity }
            : item,
        );
      } else {
        nextItems = [
          ...nextItems,
          {
            ...currentItem,
            productId: nextProductId,
            variantId: nextVariantId,
          },
        ];
      }

      const nextSelected = new Set(state.selectedIds);
      if (nextSelected.has(currentVariantId)) {
        nextSelected.delete(currentVariantId);
        nextSelected.add(nextVariantId);
      }

      return { items: nextItems, selectedIds: Array.from(nextSelected) };
    }),
  setSelectedIds: variantIds =>
    set({ selectedIds: Array.from(new Set(variantIds)) }),
  toggleSelected: (variantId, selected) =>
    set(state => {
      const next = new Set(state.selectedIds);
      if (selected) {
        next.add(variantId);
      } else {
        next.delete(variantId);
      }
      return { selectedIds: Array.from(next) };
    }),
  selectAll: variantIds =>
    set({ selectedIds: Array.from(new Set(variantIds)) }),
  removeFromCart: variantId =>
    set(state => ({
      items: state.items.filter(item => item.variantId !== variantId),
      selectedIds: state.selectedIds.filter(id => id !== variantId),
    })),
  reconcileItems: (requestedItems, availableItems) => {
    let removedCount = 0;

    set(state => {
      if (state.items !== requestedItems) return state;

      const availablePairs = new Set(
        availableItems.map(item => `${item.productId}:${item.variantId}`),
      );
      const items = state.items.filter(item =>
        availablePairs.has(`${item.productId}:${item.variantId}`),
      );
      removedCount = state.items.length - items.length;
      if (removedCount === 0) return state;

      const remainingIds = new Set(items.map(item => item.variantId));
      return {
        items,
        selectedIds: state.selectedIds.filter(id => remainingIds.has(id)),
      };
    });

    return removedCount;
  },
  clearCart: () => set({ items: [], selectedIds: [] }),
}));
