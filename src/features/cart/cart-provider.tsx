'use client';

import { createContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
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
// A refresh replaced by a navigation keeps the root layout, so the new access may never arrive: reload instead.
const refreshTimeoutMs = 5_000;
const accessKey = (access: CartAccess) => access.status === 'member' ? `member:${access.userId}` : access.status;

function createRuntime(actions: CartActionPort, refresh: () => void, reload: () => void) {
  const store = createCartStore();
  // Waiting for an access to start with: from mount (or an effect replay), and again after the cart found
  // another account and asked the server to render the page for it.
  let waiting = true;
  let fallback: ReturnType<typeof setTimeout> | undefined;
  const settle = () => { clearTimeout(fallback); fallback = undefined; };
  const controller = createCartController({
    store, local: createCartLocalAdapter(), loadProducts: loadCartProducts,
    newId: () => globalThis.crypto.randomUUID(),
    notify: { info: message => { toast.info(message); }, error: message => { toast.error(message); } },
    onAccessChanged: () => {
      waiting = true;
      refresh();
      settle();
      fallback = setTimeout(reload, refreshTimeoutMs);
    },
    actions,
  });
  const commands: CartCommands = {
    enterCart: () => controller.enterCart(),
    retry: () => controller.retry(),
    addItems: (items, onSaved) => controller.addItems(items, onSaved),
    adjustQuantity: (itemId, delta) => controller.adjustQuantity(itemId, delta),
    changeOption: (itemId, productId, variantId) => controller.changeOption(itemId, productId, variantId),
    removeItems: itemIds => controller.removeItems(itemIds),
    setSelected: (id, checked) => store.getState().setSelected(id, checked),
    selectAll: checked => store.getState().selectAll(checked),
  };

  return {
    context: { state: store, commands } satisfies CartContextValue,
    // A server render for the same account starts nothing, unless the cart is waiting for one.
    activate(access: CartAccess) {
      if (!waiting) return;
      waiting = false;
      settle();
      controller.start(access);
    },
    dispose() {
      settle();
      waiting = true;
      controller.dispose();
    },
  };
}

// One cart per account: a server render for another account gets a fresh runtime in that same render, so no
// earlier account's cart can show, while the page under it (toasts, dialogs, form input) stays mounted.
// The actions given at mount (tests inject them; the app uses the browser HTTP port) serve the Provider's lifetime.
export function CartProvider({ access, actions, children }: {
  access: CartAccess; actions?: CartActionPort; children: ReactNode;
}) {
  const router = useRouter();
  const [port] = useState(() => actions ?? createCartHttpClient());
  const create = () => createRuntime(port, () => router.refresh(), () => globalThis.location.reload());
  const key = accessKey(access);
  const [current, setCurrent] = useState(() => ({ key, runtime: create() }));
  let { runtime } = current;
  // State derived from this render's props, as React allows: this render already uses the new runtime,
  // and the effect below disposes the previous one.
  if (current.key !== key) {
    runtime = create();
    setCurrent({ key, runtime });
  }

  useEffect(() => () => runtime.dispose(), [runtime]);
  useEffect(() => { runtime.activate(access); }, [runtime, access]);

  return <CartContext.Provider value={runtime.context}>{children}</CartContext.Provider>;
}
