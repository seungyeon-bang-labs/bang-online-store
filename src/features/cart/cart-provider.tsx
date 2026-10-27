'use client';

import { createContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { StoreApi } from 'zustand/vanilla';
import type { CartAccess, CartActionPort } from '@/domains/cart/cart.contract';
import { createCartLocalAdapter } from '@/domains/cart/cart.local';
import { createCartStore, type CartSelectionCommands, type CartState } from '@/domains/cart/cart.store';
import { createCartController, type CartController } from './cart-controller';
import { createCartHttpClient } from './cart.http-client';
import { loadCartProducts } from './cart.product-client';

export type CartCommands = Pick<CartController,
  'enterCart' | 'retry' | 'addItems' | 'adjustQuantity' | 'changeOption' | 'removeItems'
> & CartSelectionCommands;
type CartContextValue = {
  state: Pick<StoreApi<CartState>, 'getState' | 'getInitialState' | 'subscribe'>;
  commands: CartCommands;
};

// Context holds no account state outside an individual Provider instance.
export const CartContext = createContext<CartContextValue | null>(null);
const accessKey = (access: CartAccess) => access.status === 'member' ? `member:${access.userId}`
  : access.status === 'restricted' ? `restricted:${access.reason}` : access.status;
const hidden: CartState = { phase: 'loading', access: null, cart: null, busy: false, pendingAdd: 0, selectedIds: [], message: null };

function createRuntime(actions: CartActionPort) {
  // The server access this Provider last applied; restarts inside the controller do not change it.
  let applied: CartAccess | null = null;
  // The access of the latest committed render; the stable commands below act for it.
  let rendered: CartAccess | null = null;
  const shownKey = () => { const shown = store.getState().access; return shown ? accessKey(shown) : null; };
  const store = createCartStore();
  const controller = createCartController({
    store, local: createCartLocalAdapter(), loadProducts: loadCartProducts,
    newId: () => globalThis.crypto.randomUUID(),
    notify: { info: message => { toast.info(message); }, error: message => { toast.error(message); } },
    actions,
  });

  const visible = (access: CartAccess | null) => access !== null && (applied === access || shownKey() === accessKey(access));
  const current = () => visible(rendered);
  // One commands object for the Provider's lifetime, so a same-account server render does not look like a cart entry.
  const commands: CartCommands = {
    enterCart: () => { if (current()) controller.enterCart(); },
    retry: () => { if (current()) controller.retry(); },
    addItems: items => current() && controller.addItems(items),
    adjustQuantity: (itemId, delta) => current() && controller.adjustQuantity(itemId, delta),
    changeOption: (itemId, productId, variantId) => current() && controller.changeOption(itemId, productId, variantId),
    removeItems: itemIds => current() && controller.removeItems(itemIds),
    setSelected: (id, checked) => { if (current()) store.getState().setSelected(id, checked); },
    selectAll: checked => { if (current()) store.getState().selectAll(checked); },
  };

  return {
    // Set on commit, so a render React throws away cannot point the commands at another account.
    commit(access: CartAccess) { rendered = access; },
    // Each server render brings a new access object; restart only when the cart shows another account,
    // or on the first activation after a dispose (an effect replay disowned the earlier start).
    activate(access: CartAccess) {
      const fresh = applied === null;
      applied = access;
      if (fresh || shownKey() !== accessKey(access)) controller.start(access);
    },
    dispose() {
      applied = null;
      controller.dispose();
    },
    // Between a server render for another account and its start effect, the shown cart stays hidden.
    view(access: CartAccess): CartContextValue {
      let source: ReturnType<typeof store.getState> | undefined;
      let cached: CartState;
      const getState = (): CartState => {
        if (!visible(access)) return hidden;
        const next = store.getState();
        if (next !== source) {
          source = next;
          cached = { phase: next.phase, access: next.access, cart: next.cart, busy: next.busy, pendingAdd: next.pendingAdd, selectedIds: next.selectedIds, message: next.message };
        }
        return cached;
      };
      return { state: { getState, getInitialState: () => hidden, subscribe: store.subscribe }, commands };
    },
  };
}

// The actions given at mount (tests inject them; the app uses the browser HTTP port) serve the Provider's lifetime.
export function CartProvider({ access, actions, children }: {
  access: CartAccess; actions?: CartActionPort; children: ReactNode;
}) {
  const [runtime] = useState(() => createRuntime(actions ?? createCartHttpClient()));
  const context = useMemo(() => runtime.view(access), [runtime, access]);

  useLayoutEffect(() => { runtime.commit(access); }, [runtime, access]);
  useEffect(() => () => runtime.dispose(), [runtime]);
  useEffect(() => { runtime.activate(access); }, [runtime, access]);

  return <CartContext.Provider value={context}>{children}</CartContext.Provider>;
}
