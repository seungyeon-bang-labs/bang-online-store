'use client';

import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useStore } from 'zustand';
import { toast } from 'sonner';
import type { StoreApi } from 'zustand/vanilla';
import type { CartAccess, CartActionPort, CartReply } from '@/domains/cart/cart.contract';
import { createCartLocalAdapter } from '@/domains/cart/cart.local';
import { createCartStore, type CartSelectionCommands, type CartState } from '@/domains/cart/cart.store';
import { createCartController, type CartController } from './cart-controller';
import { createCartHttpClient } from './cart.http-client';
import { loadCartProducts } from './cart.product-client';

type CartCommands = Pick<CartController,
  'enterCart' | 'addItems' | 'adjustQuantity' | 'changeOption' | 'removeItems' | 'retry' | 'beginAuthTransition' | 'recheck'
> & CartSelectionCommands;
type CartContextValue = {
  state: Pick<StoreApi<CartState>, 'getState' | 'getInitialState' | 'subscribe'>;
  commands: CartCommands;
};

// Context holds no account state outside an individual Provider instance.
export const CartContext = createContext<CartContextValue | null>(null);
const accessKey = (access: CartAccess) => access.status === 'member' ? `member:${access.userId}`
  : access.status === 'restricted' ? `restricted:${access.reason}` : access.status;
const blocked = (): CartReply => ({ status: 'retryable', message: '장바구니 계정을 확인하고 있습니다. 잠시 후 다시 시도해주세요.' });

function createRuntime(initialActions: CartActionPort) {
  let actions = initialActions;
  let appliedSnapshot: string | null = null;
  let lastPath: string | null | undefined;
  let navigation = 0;
  let initialization: Promise<void> = Promise.resolve();
  let entry: Promise<void> | null = null;
  const store = createCartStore();
  const controller = createCartController({
    store, local: createCartLocalAdapter(), loadProducts: loadCartProducts,
    newId: () => globalThis.crypto.randomUUID(),
    actions: {
      resolveAccess: options => actions.resolveAccess(options),
      read: (input, options) => actions.read(input, options),
      mutate: (command, options) => actions.mutate(command, options),
    },
  });

  return {
    updateActions(next: CartActionPort) { actions = next; },
    activate(access: CartAccess) {
      appliedSnapshot = accessKey(access);
      navigation++;
      initialization = controller.start(access);
      // Notify a previously masked subscriber even if start kept a ready cache.
      store.getState().setStateFromController({});
    },
    dispose() {
      appliedSnapshot = null; navigation++;
      controller.dispose();
    },
    async navigate(path: string | null) {
      if (lastPath === path) return;
      const first = lastPath === undefined;
      lastPath = path;
      if (first) return;
      const request = ++navigation;
      await initialization;
      // A page's enterCart and the pathname effect share its item refresh.
      if (entry) await entry;
      if (request === navigation) await controller.recheck('navigation');
    },
    view(snapshotKey: string): CartContextValue {
      const visible = () => appliedSnapshot === snapshotKey;
      const hidden: CartState = { phase: 'checking', access: null, cart: null, selectedIds: [], message: null, settledRequests: {} };
      let source: ReturnType<typeof store.getState> | undefined;
      let cached: CartState;
      const getState = (): CartState => {
        if (!visible()) return hidden;
        const next = store.getState();
        if (next !== source) {
          source = next;
          cached = { phase: next.phase, access: next.access, cart: next.cart, selectedIds: next.selectedIds, message: next.message, settledRequests: next.settledRequests };
        }
        return cached;
      };
      const commands: CartCommands = {
        async enterCart() {
          if (!visible()) return;
          const pending = controller.enterCart(); entry = pending;
          try { await pending; } finally { if (entry === pending) entry = null; }
        },
        addItems: items => visible() ? controller.addItems(items) : Promise.resolve(blocked()),
        adjustQuantity: (itemId, delta) => visible() ? controller.adjustQuantity(itemId, delta) : Promise.resolve(blocked()),
        changeOption: (itemId, productId, variantId) => visible() ? controller.changeOption(itemId, productId, variantId) : Promise.resolve(blocked()),
        removeItems: itemIds => visible() ? controller.removeItems(itemIds) : Promise.resolve(blocked()),
        retry: () => visible() ? controller.retry() : Promise.resolve(),
        recheck: reason => visible() ? controller.recheck(reason) : Promise.resolve(),
        beginAuthTransition: () => { if (visible()) { navigation++; controller.beginAuthTransition(); } },
        setSelected: (id, checked) => { if (visible()) store.getState().setSelected(id, checked); },
        selectAll: checked => { if (visible()) store.getState().selectAll(checked); },
      };
      return { state: { getState, getInitialState: () => hidden, subscribe: store.subscribe }, commands };
    },
  };
}

// Without injected actions the Provider owns one browser HTTP port for its lifetime.
export function CartProvider({ access, actions, children }: {
  access: CartAccess; actions?: CartActionPort; children: ReactNode;
}) {
  const pathname = usePathname();
  const [runtime] = useState(() => createRuntime(actions ?? createCartHttpClient()));
  const snapshotKey = accessKey(access);
  const context = useMemo(() => runtime.view(snapshotKey), [runtime, snapshotKey]);
  const cart = useStore(context.state, state => state.cart);
  const [shownNotices] = useState(() => new WeakSet<object>());

  useEffect(() => { if (actions) runtime.updateActions(actions); }, [runtime, actions]);
  useEffect(() => () => runtime.dispose(), [runtime]);
  useEffect(() => { runtime.activate(access); }, [runtime, access]);
  useEffect(() => { void runtime.navigate(pathname); }, [runtime, pathname]);
  useEffect(() => {
    for (const notice of cart?.notices ?? []) {
      if (shownNotices.has(notice)) continue;
      shownNotices.add(notice);
      toast.info(notice.kind === 'quantity_adjusted' ? '현재 재고에 맞게 수량을 조정했습니다.'
        : notice.kind === 'sold_out' ? '품절된 옵션은 새로 담거나 수량을 변경할 수 없습니다.'
        : notice.kind === 'unavailable' ? '현재 이용할 수 없는 상품을 장바구니에서 제외했습니다.'
        : notice.kind === 'item_missing' ? '이미 변경되거나 삭제된 장바구니 항목입니다.'
        : notice.kind === 'merge_returned' ? '로그인 전에 담은 상품을 회원 장바구니로 옮기지 못했습니다. 상품은 이 계정으로 보관했다가 다음에 접속할 때 다시 옮깁니다.'
        : '선택한 옵션으로 변경할 수 없습니다.');
    }
  }, [cart, shownNotices]);

  return <CartContext.Provider value={context}>{children}</CartContext.Provider>;
}
