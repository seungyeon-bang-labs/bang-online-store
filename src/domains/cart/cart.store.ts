import { create } from 'zustand';

export interface CartItem {
  productId: number;
  variantId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  selectedIds: string[];
  addToCart: (productId: number, variantId: string, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  updateOption: (
    currentVariantId: string,
    nextProductId: number,
    nextVariantId: string,
  ) => void;
  setSelectedIds: (variantIds: string[]) => void;
  toggleSelected: (variantId: string, selected: boolean) => void;
  selectAll: (variantIds: string[]) => void;
  removeFromCart: (variantId: string) => void;
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
  clearCart: () => set({ items: [], selectedIds: [] }),
}));
