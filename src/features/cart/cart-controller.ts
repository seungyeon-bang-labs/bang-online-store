import type {
  CartAccess,
  CartActionPort,
  CartCommand,
  CartProductInput,
  CartReply,
} from '@/domains/cart/cart.contract';
import type { CartLocalAdapter } from '@/domains/cart/cart.local';
import type { CartViewModel } from '@/domains/cart/cart.view-model';
import type { CartState, createCartStore } from '@/domains/cart/cart.store';
import { parseMemberCartView } from '@/domains/cart/cart.schema';
import {
  parseCartProductResponse,
  type loadCartProducts,
} from './cart.product-client';
import { getCartItemCount as quantityOf } from '@/domains/cart';
import {
  applyGuestChange,
  buildGuestCart,
  pairKey,
  type CartChange,
} from './guest-cart';
import { selectCartLocked as locked } from './cart-count';
import { previewChange } from './cart-preview';
import { failureMessage, messages, noticeMessage } from './cart-messages';

export type CartNotify = {
  info(message: string): void;
  error(message: string): void;
};

export interface CartController {
  start(access: CartAccess): void;
  enterCart(): void;
  retry(): void;
  addItems(items: readonly CartProductInput[]): boolean;
  adjustQuantity(itemId: string, delta: 1 | -1): boolean;
  changeOption(itemId: string, productId: number, variantId: number): boolean;
  removeItems(itemIds: readonly string[]): boolean;
  whenIdle(): Promise<void>;
  dispose(): void;
}

const failed: CartReply = { status: 'retryable', message: messages.loadFailed };
// The HTTP client checks only the envelope; a malformed cart is treated like a lost reply.
function checked(reply: CartReply): CartReply {
  if (reply.status !== 'ok') return reply;
  parseMemberCartView(reply.cart);
  parseCartProductResponse({
    cartItems: reply.cart.items,
    optionGroups: reply.cart.optionGroups,
  });
  return reply;
}

export function createCartController({
  store,
  local,
  actions,
  loadProducts,
  newId,
  notify,
}: {
  store: ReturnType<typeof createCartStore>;
  local: CartLocalAdapter;
  actions: CartActionPort;
  loadProducts: typeof loadCartProducts;
  newId: () => string;
  notify: CartNotify;
}): CartController {
  let generation = 0;
  let serverCart: CartViewModel | null = null;
  let running: Promise<void> | null = null;
  const state = () => store.getState();
  const set = (next: Partial<CartState>) =>
    state().setStateFromController(next);

  async function safe(request: () => Promise<CartReply>): Promise<CartReply> {
    try {
      return checked(await request());
    } catch {
      return failed;
    }
  }

  // Runs one request while busy; a restart (new generation) disowns it, so its late results change nothing.
  function run(work: (live: () => boolean) => Promise<void>) {
    const owner = generation;
    const live = () => owner === generation;
    set({ busy: true });
    running = work(live)
      .catch(() => {
        // An unexpected error must not leave adds counted or the view half-changed: fall back to the last server cart.
        if (!live()) return;
        const cart = serverCart ?? state().cart;
        set(
          cart
            ? { cart, pendingAdd: 0 }
            : { pendingAdd: 0, phase: 'error', message: messages.loadFailed },
        );
        notify.error(messages.loadFailed);
      })
      .finally(() => {
        if (live()) set({ busy: false });
      });
  }

  function show(cart: CartViewModel) {
    if (cart.owner.kind === 'member') serverCart = cart;
    set({ cart, pendingAdd: 0, phase: 'ready', message: null });
    for (const message of new Set(cart.notices.map(noticeMessage)))
      notify.info(message);
  }

  const owns = (cart: CartViewModel, userId: string) =>
    cart.owner.kind === 'member' &&
    cart.owner.userId.toLowerCase() === userId.toLowerCase();

  // 'stale' means the flow was replaced (restart or newer generation) and must stop.
  async function readMember(
    live: () => boolean,
    userId: string,
  ): Promise<'ok' | 'failed' | 'stale'> {
    const reply = await safe(() => actions.read({ expectedUserId: userId }));
    if (!live()) return 'stale';
    if (reply.status === 'access_changed') {
      start(reply.access);
      return 'stale';
    }
    if (reply.status !== 'ok' || !owns(reply.cart, userId)) return 'failed';
    show(reply.cart);
    return 'ok';
  }

  async function readMemberOrFail(live: () => boolean, userId: string) {
    if ((await readMember(live, userId)) === 'failed')
      set({ phase: 'error', message: messages.loadFailed });
  }

  async function startMember(live: () => boolean, userId: string) {
    let items: CartProductInput[] = [];
    try {
      items = local
        .read()
        .items.map(({ productId, variantId, quantity }) => ({
          productId,
          variantId,
          quantity,
        }));
    } catch {
      /* no guest storage: nothing to merge */
    }
    if (items.length && !(await merge(live, userId, items))) return;
    if (!live()) return;
    await readMemberOrFail(live, userId);
  }

  // Returns true when the member cart still needs a read.
  async function merge(
    live: () => boolean,
    userId: string,
    items: readonly CartProductInput[],
  ): Promise<boolean> {
    let requestId: string;
    try {
      requestId = local.ensureMergeId(newId);
    } catch {
      return true;
    }
    const command: CartCommand = {
      version: 1,
      requestId,
      expectedUserId: userId,
      operation: { kind: 'merge_guest', items },
    };
    const reply = await safe(() => actions.mutate(command));
    if (!live()) return false;
    if (reply.status === 'access_changed') {
      start(reply.access);
      return false;
    }
    if (
      reply.status === 'ok' &&
      owns(reply.cart, userId) &&
      reply.cart.operation?.requestId === requestId
    ) {
      clearMerge(requestId);
      // A rejected merge is reported with one reason of its own, not the server notices as well.
      if (reply.cart.operation.outcome === 'rejected') {
        show({ ...reply.cart, notices: [] });
        notify.error(messages.mergeRejected);
      } else show(reply.cart);
      return false;
    }
    // The server ruled on this exact request; resending gives the same answer.
    if (reply.status === 'invalid' || reply.status === 'conflict') {
      clearMerge(requestId);
      notify.error(messages.mergeFailed);
    }
    return true;
  }

  function clearMerge(requestId: string) {
    try {
      local.clearIfMergeId(requestId);
    } catch {
      /* storage vanished: nothing left to clear */
    }
  }

  function readGuest() {
    try {
      return local.read().items;
    } catch {
      return null;
    }
  }

  function guestLoadFailed() {
    set({ phase: 'error', message: messages.guestLoadFailed, pendingAdd: 0 });
    notify.error(messages.guestLoadFailed);
  }

  async function rebuildGuest(live: () => boolean) {
    let lines = readGuest();
    if (!lines) {
      guestLoadFailed();
      return;
    }
    let products: Awaited<ReturnType<typeof loadCartProducts>> = {
      cartItems: [],
      optionGroups: {},
    };
    // Another tab may save while products load; cleanup must never write over lines it has not seen.
    for (let attempt = 0; ; attempt++) {
      if (lines.length) {
        const pairs = [
          ...new Map(
            lines.map(({ productId, variantId }) => [
              pairKey({ productId, variantId }),
              { productId, variantId },
            ]),
          ).values(),
        ];
        try {
          products = await loadProducts(pairs);
        } catch {
          if (live()) guestLoadFailed();
          return;
        }
      }
      if (!live()) return;
      const latest = readGuest();
      if (latest && JSON.stringify(latest) === JSON.stringify(lines)) break;
      if (!latest || attempt === 2) {
        guestLoadFailed();
        return;
      }
      lines = latest;
    }
    const built = buildGuestCart(lines, products);
    if (built.changed) {
      try {
        local.write(built.lines);
      } catch {
        /* cleanup is redone on the next build */
      }
    }
    show(built.cart);
  }

  function start(access: CartAccess) {
    generation++;
    serverCart = null;
    set({
      access,
      cart: null,
      busy: false,
      pendingAdd: 0,
      selectedIds: [],
      message: null,
      phase: 'loading',
    });
    if (access.status === 'restricted') {
      set({ phase: 'restricted', message: messages.restricted });
      return;
    }
    if (access.status === 'error') {
      set({ phase: 'error', message: access.message });
      return;
    }
    if (access.status === 'member') {
      const { userId } = access;
      run(live => startMember(live, userId));
      return;
    }
    run(live => rebuildGuest(live));
  }

  function change(next: CartChange): boolean {
    const current = state();
    if (locked(current)) return false;
    if (
      next.kind === 'add_items' &&
      (!next.items.length ||
        next.items.some(
          item => !Number.isInteger(item.quantity) || item.quantity < 1,
        ))
    )
      return false;
    const access = current.access;
    if (access?.status === 'guest') return changeGuest(current, next);
    if (access?.status !== 'member') return false;
    const userId = access.userId;
    if (next.kind === 'add_items')
      set({ pendingAdd: current.pendingAdd + quantityOf(next.items) });
    else if (current.cart) set({ cart: previewChange(current.cart, next) });
    const command: CartCommand = {
      version: 1,
      requestId: newId(),
      expectedUserId: userId,
      operation: next,
    };
    run(save);
    return true;

    async function save(live: () => boolean) {
      const reply = await safe(() => actions.mutate(command));
      if (!live()) return;
      if (reply.status === 'access_changed') {
        start(reply.access);
        return;
      }
      if (
        reply.status === 'ok' &&
        owns(reply.cart, userId) &&
        reply.cart.operation?.requestId === command.requestId
      ) {
        show(reply.cart);
        if (
          reply.cart.operation.outcome === 'rejected' &&
          !reply.cart.notices.length
        )
          notify.error(failureMessage[next.kind]);
        return;
      }
      // Unknown whether it was saved: the server cart decides.
      const result = await readMember(live, userId);
      if (result === 'stale') return;
      if (result === 'failed')
        set({
          cart: serverCart,
          pendingAdd: 0,
          phase: 'error',
          message: messages.loadFailed,
        });
      notify.error(failureMessage[next.kind]);
    }
  }

  // Saves to storage at once (the latest stored lines, not this tab's copy), then rebuilds the view while busy.
  // False when nothing was saved, so callers do not report success.
  function changeGuest(current: CartState, next: CartChange): boolean {
    let saved = false;
    try {
      const result = applyGuestChange(local.read().items, next, newId);
      if (result.status === 'missing') notify.error(messages.itemMissing);
      else {
        local.write(result.lines);
        saved = true;
        // Like the server's itemIdMap: a line merged away hands its selection to the line it joined.
        const { itemIdMap } = result;
        if (itemIdMap)
          set({
            selectedIds: current.selectedIds.map(id => itemIdMap[id] ?? id),
          });
      }
    } catch {
      notify.error(messages.guestWriteFailed);
      // Storage that cannot be read leaves nothing to rebuild from: show the error without a second toast.
      if (!readGuest()) {
        set({
          phase: 'error',
          message: messages.guestLoadFailed,
          pendingAdd: 0,
        });
        return false;
      }
    }
    if (saved) {
      if (next.kind === 'add_items')
        set({ pendingAdd: current.pendingAdd + quantityOf(next.items) });
      else if (current.cart) set({ cart: previewChange(current.cart, next) });
    }
    run(live => rebuildGuest(live));
    return saved;
  }

  async function reread(live: () => boolean, access: CartAccess | null) {
    if (access?.status === 'guest') return rebuildGuest(live);
    if (access?.status !== 'member') return;
    await readMemberOrFail(live, access.userId);
  }

  async function resolveAccess(): Promise<CartAccess> {
    try {
      return await actions.resolveAccess();
    } catch {
      return { status: 'error', message: messages.loadFailed };
    }
  }

  // A guest tab asks the server first, so a login made in another tab is picked up here.
  async function enterGuest(live: () => boolean) {
    const access = await resolveAccess();
    if (!live()) return;
    if (access.status === 'member' || access.status === 'restricted') {
      start(access);
      return;
    }
    await rebuildGuest(live);
  }

  return {
    start,
    enterCart() {
      const current = state();
      if (current.busy) return;
      set({ selectedIds: [] });
      if (current.access?.status === 'member')
        run(live => reread(live, current.access));
      else if (current.access?.status === 'guest') run(enterGuest);
    },
    retry() {
      const current = state();
      if (current.busy) return;
      if (current.access?.status === 'error') {
        run(async live => {
          const access = await resolveAccess();
          if (live()) start(access);
        });
        return;
      }
      if (
        current.access?.status === 'member' ||
        current.access?.status === 'guest'
      )
        run(live => reread(live, current.access));
    },
    addItems: items => change({ kind: 'add_items', items }),
    adjustQuantity: (itemId, delta) =>
      change({ kind: 'adjust_quantity', itemId, delta }),
    changeOption: (itemId, productId, variantId) =>
      change({ kind: 'change_option', itemId, productId, variantId }),
    removeItems: itemIds => change({ kind: 'remove_items', itemIds }),
    async whenIdle() {
      while (running) {
        const current = running;
        await current;
        if (running === current) running = null;
      }
    },
    dispose() {
      generation++;
    },
  };
}
