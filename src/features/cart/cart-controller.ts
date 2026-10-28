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
} from '@/domains/cart/cart.guest';
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
  // True when the add was taken; onSaved runs once it is actually saved (at once for a guest, on the server's reply for a member).
  addItems(items: readonly CartProductInput[], onSaved?: () => void): boolean;
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
  onAccessChanged,
}: {
  store: ReturnType<typeof createCartStore>;
  local: CartLocalAdapter;
  actions: CartActionPort;
  loadProducts: typeof loadCartProducts;
  newId: () => string;
  notify: CartNotify;
  // Asks the server to render the page again; the Provider then starts for the account the server names.
  onAccessChanged: () => void;
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

  // Every member request ends in one of these:
  // - stale: the flow was replaced (restart or newer generation) and must stop
  // - changed: the server refused it for another account; the server was asked to render that account
  // - ok: this account's cart, answering this exact request when one is given
  // - refused: the server ruled on the request (invalid or conflict)
  // - unknown: no reply, a malformed one, or one for another request or account
  async function ask(
    live: () => boolean,
    userId: string,
    request: () => Promise<CartReply>,
    requestId?: string,
  ): Promise<
    | { kind: 'ok'; cart: CartViewModel }
    | { kind: 'stale' | 'changed' | 'refused' | 'unknown' }
  > {
    const reply = await safe(request);
    if (!live()) return { kind: 'stale' };
    if (reply.status === 'access_changed') {
      accessChanged();
      return { kind: 'changed' };
    }
    if (reply.status === 'invalid' || reply.status === 'conflict')
      return { kind: 'refused' };
    if (
      reply.status !== 'ok' ||
      !owns(reply.cart, userId) ||
      (requestId !== undefined &&
        reply.cart.operation?.requestId !== requestId)
    )
      return { kind: 'unknown' };
    return { kind: 'ok', cart: reply.cart };
  }

  async function readMember(
    live: () => boolean,
    userId: string,
  ): Promise<'ok' | 'failed' | 'stale'> {
    const answer = await ask(live, userId, () =>
      actions.read({ expectedUserId: userId }),
    );
    if (answer.kind === 'stale' || answer.kind === 'changed') return 'stale';
    if (answer.kind !== 'ok') return 'failed';
    show(answer.cart);
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
    const answer = await ask(
      live,
      userId,
      () => actions.mutate(command),
      requestId,
    );
    // Account changed: the guest cart and its merge ID stay for the account the server names.
    if (answer.kind === 'stale' || answer.kind === 'changed') return false;
    if (answer.kind === 'ok') {
      clearMerge(requestId);
      // A rejected merge is reported with one reason of its own, not the server notices as well.
      if (answer.cart.operation?.outcome === 'rejected') {
        show({ ...answer.cart, notices: [] });
        notify.error(messages.mergeRejected);
      } else show(answer.cart);
      return false;
    }
    // The server ruled on this exact request; resending gives the same answer.
    if (answer.kind === 'refused') {
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

  // Another account was found: drop this one's view and wait locked for the server render of the new one.
  function accessChanged() {
    generation++;
    serverCart = null;
    set({ access: null, cart: null, busy: false, pendingAdd: 0, selectedIds: [], message: null, phase: 'loading' });
    onAccessChanged();
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

  function change(next: CartChange, onSaved?: () => void): boolean {
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
    if (access?.status === 'guest') return changeGuest(current, next, onSaved);
    if (access?.status !== 'member') return false;
    const userId = access.userId;
    // The ID comes first: a browser that cannot make one (non-secure origin) must not leave a preview behind.
    let requestId: string;
    try {
      requestId = newId();
    } catch {
      notify.error(failureMessage[next.kind]);
      return false;
    }
    if (next.kind === 'add_items')
      set({ pendingAdd: current.pendingAdd + quantityOf(next.items) });
    else if (current.cart) set({ cart: previewChange(current.cart, next) });
    const command: CartCommand = {
      version: 1,
      requestId,
      expectedUserId: userId,
      operation: next,
    };
    run(save);
    return true;

    async function save(live: () => boolean) {
      const answer = await ask(
        live,
        userId,
        () => actions.mutate(command),
        command.requestId,
      );
      if (answer.kind === 'stale') return;
      // Not saved for any account: the page moves on to the other one, so say this change did not happen.
      if (answer.kind === 'changed') {
        notify.error(failureMessage[next.kind]);
        return;
      }
      if (answer.kind === 'ok') {
        show(answer.cart);
        if (answer.cart.operation?.outcome !== 'rejected') onSaved?.();
        else if (!answer.cart.notices.length)
          notify.error(failureMessage[next.kind]);
        return;
      }
      // Refused, or unknown whether it was saved: the server cart decides.
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
  function changeGuest(
    current: CartState,
    next: CartChange,
    onSaved?: () => void,
  ): boolean {
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
    if (saved) onSaved?.();
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
      accessChanged();
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
          if (!live()) return;
          if (access.status === 'error') set({ phase: 'error', message: access.message });
          else accessChanged();
        });
        return;
      }
      if (
        current.access?.status === 'member' ||
        current.access?.status === 'guest'
      )
        run(live => reread(live, current.access));
    },
    addItems: (items, onSaved) => change({ kind: 'add_items', items }, onSaved),
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
