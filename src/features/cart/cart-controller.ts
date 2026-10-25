import type { CartAccess, CartActionPort, CartCommand, CartLine, CartNotice, CartOperation, CartProductInput, CartReply } from '@/domains/cart/cart.contract';
import type { CartLocalAdapter } from '@/domains/cart/cart.local';
import type { CartViewModel } from '@/domains/cart/cart.view-model';
import type { createCartStore } from '@/domains/cart/cart.store';
import { cartCommandSchema, parseCartSnapshot } from '@/domains/cart/cart.schema';
import { getAdjustedQuantity, reconcileSelection } from '@/domains/cart/cart.rules';
import { parseGuestCartProductResponse, parseCartProductResponse, type loadCartProducts } from './cart.product-client';

// Correlation metadata is client-only; Server Action/RPC replies are unchanged.
export type CartCommandReply = CartReply & { requestId?: string };

export interface CartController {
  start(access: CartAccess): Promise<void>;
  recheck(reason: 'navigation' | 'auth' | 'storage'): Promise<void>;
  enterCart(): Promise<void>;
  addItems(items: readonly CartProductInput[]): Promise<CartCommandReply>;
  adjustQuantity(itemId: string, delta: 1 | -1): Promise<CartCommandReply>;
  changeOption(itemId: string, productId: number, variantId: number): Promise<CartCommandReply>;
  removeItems(itemIds: readonly string[]): Promise<CartCommandReply>;
  retry(): Promise<void>;
  beginAuthTransition(): void;
  dispose(): void;
}

const nil = '00000000-0000-0000-0000-000000000000';
const retryMessage = '장바구니를 다시 확인해주세요. 기존 내역과 미완료 요청은 보존됩니다.';
const pendingAuthMessage = '다른 창에서 로그인 상태가 바뀌고 있습니다. 잠시 후 다시 시도해주세요.';
class StaleFlow extends Error {}
class AccessChange extends Error {
  constructor(readonly access: CartAccess) { super(); }
}
class FlowFailure extends Error {
  constructor(readonly status: 'retryable' | 'invalid' | 'conflict' = 'retryable', message = retryMessage) { super(message); }
}
type Context = { generation: number; order: number; signal: AbortSignal; epoch?: number };
const key = (access: CartAccess) => access.status === 'member' ? `member:${access.userId}` : access.status === 'restricted' ? `restricted:${access.reason}` : access.status;
const pairKey = (item: { productId: number; variantId: number }) => `${item.productId}:${item.variantId}`;

export function createCartController({ store, local, actions, loadProducts, newId }: {
  store: ReturnType<typeof createCartStore>; local: CartLocalAdapter; actions: CartActionPort;
  loadProducts: typeof loadCartProducts; newId: () => string;
}): CartController {
  let active = false;
  let generation = 0;
  let order = 0;
  let owner: string | null = null;
  let snapshotOwner: string | null = null;
  // The account this tab last actually showed (props can lag behind accounts learned from other tabs); errors never overwrite it.
  let shownAccount: string | null = null;
  let restageFor: string | null = null; // a member newly shown here, whose held items are retried once
  let pendingAuthOwner: string | null = null;
  let cartId: string | null = null;
  let revision: bigint | null = null;
  let observedEpoch: number | null = null;
  // An interrupted login merge, bound to the guest revision seen when that member was confirmed.
  let mergeOwner: { userId: string; guestRevision: number } | null = null;
  let deferredRecheck: Promise<void> | null = null;
  let published = 0; // counts carts actually read and shown, so cart entry knows whether a waited flow refreshed items
  let abort: AbortController | null = null;
  let unsubscribe: (() => void) | null = null;
  let running: Promise<CartReply | void> | null = null;
  let starting: { key: string; generation: number; promise: Promise<void> } | null = null;
  let authSignal: Promise<void> = Promise.resolve();
  // A failed conditional notice is retried as the same conditional notice, never as an unconditional release.
  let signalIsNotice = false;
  let heldNoticeFor: string | null = null; // the member whose rejected login merge was just held; told once with their next cart
  const seenNotices = new Set<string>();
  const unconfirmed = new Map<string, CartCommand>();
  const set = (next: Parameters<ReturnType<typeof store.getState>['setStateFromController']>[0]) => store.getState().setStateFromController(next);
  const current = (ctx: Context) => active && ctx.generation === generation && ctx.order === order;
  const check = (ctx: Context) => { if (!current(ctx)) throw new StaleFlow(); };

  function reset() {
    generation++; order++; abort?.abort(); cartId = null; revision = null; owner = null; starting = null; heldNoticeFor = null;
  }

  function holdPendingAuth(ctx: Context, document: { authPending?: boolean }) {
    check(ctx);
    if (!document.authPending) return;
    reset();
    // The initiating tab waits for its new snapshot; an already open tab offers an explicit recheck.
    if (pendingAuthOwner !== null) set({ cart: null, access: null, selectedIds: [], phase: 'checking', message: null });
    else set({ cart: null, access: null, selectedIds: [], phase: 'retryable', message: pendingAuthMessage });
    throw new StaleFlow();
  }

  // Re-entry and explicit retry: check the real session, then release only the epoch observed before it.
  async function settlePendingAuth(ctx: Context): Promise<CartAccess | null> {
    const document = await local.read(); check(ctx);
    if (!document.authPending || pendingAuthOwner !== null) return null;
    const access = await actions.resolveAccess({ signal: ctx.signal }); check(ctx);
    if (access.status !== 'error' && await local.completeAuthTransition(document.authEpoch)) { check(ctx); return access; }
    check(ctx);
    // Another flow may have released it meanwhile; a newer transition stays locked.
    if (access.status !== 'error' && !(await local.read()).authPending) return null;
    throw new FlowFailure('retryable', pendingAuthMessage);
  }

  function listen() {
    if (!unsubscribe) unsubscribe = local.subscribe(() => { void controller.recheck('storage'); });
  }

  function restartFlow(ctx: Context) {
    reset();
    abort = new AbortController();
    ctx.generation = generation; ctx.order = order; ctx.signal = abort.signal;
  }

  function accessState(ctx: Context, access: CartAccess) {
    check(ctx);
    if (access.status !== 'error' && shownAccount !== key(access)) {
      shownAccount = key(access); restageFor = access.status === 'member' ? access.userId : null;
    }
    if (owner !== key(access)) {
      generation++; ctx.generation = generation; owner = key(access); cartId = null; revision = null; heldNoticeFor = null;
      set({ access, phase: 'checking', cart: null, selectedIds: [], message: null });
      return;
    }
    set({ access, message: null });
  }

  function publish(received: CartViewModel) {
    published++;
    const cart = heldNoticeFor !== null && received.owner.kind === 'member' && received.owner.userId === heldNoticeFor
      ? { ...received, notices: [...received.notices, { kind: 'merge_returned' as const }] } : received;
    if (cart !== received) heldNoticeFor = null;
    const account = cart.owner.kind === 'member' ? cart.owner.userId : 'guest';
    const operationNotices = new Set(cart.operation?.notices.map(notice => JSON.stringify(notice)) ?? []);
    const notices = cart.notices.filter(notice => {
      const signature = JSON.stringify(notice);
      const scope = cart.operation && operationNotices.has(signature)
        ? `${account}:request:${cart.operation.requestId}` : `${account}:cart:${cart.cartId ?? 'guest'}:${cart.revision}`;
      const id = `${scope}:${signature}`;
      if (seenNotices.has(id)) return false;
      seenNotices.add(id); return true;
    });
    const shown = new Set(notices.map(notice => JSON.stringify(notice)));
    const next = { ...cart, notices, operation: cart.operation && { ...cart.operation, notices: cart.operation.notices.filter(notice => shown.has(JSON.stringify(notice))) } };
    set({ cart: next, selectedIds: reconcileSelection(store.getState().selectedIds, next.items, next.operation?.itemIdMap) });
  }

  async function checkEpoch(ctx: Context) {
    const document = await local.read(); holdPendingAuth(ctx, document);
    if (ctx.epoch !== undefined && ctx.epoch !== document.authEpoch) {
      const access = await actions.resolveAccess({ signal: ctx.signal }); check(ctx); throw new AccessChange(access);
    }
    return document;
  }

  async function consume(ctx: Context, reply: CartReply, expectedUser: string, command?: CartCommand) {
    check(ctx);
    if (reply.status === 'access_changed') throw new AccessChange(reply.access);
    if (reply.status !== 'ok') {
      // The server ruled this request can never apply; release it so later changes are not blocked forever.
      if (command && (reply.status === 'invalid' || reply.status === 'conflict')) {
        // A rejected login merge keeps its items bound to that account (spec: unmerged items stay with the original account).
        if (command.operation.kind === 'merge_guest') { if (await local.holdMerge(command)) heldNoticeFor = command.expectedUserId; }
        else await local.ack(command);
        check(ctx); unconfirmed.delete(command.requestId);
        set({ settledRequests: { ...store.getState().settledRequests, [command.requestId]: { requestId: command.requestId, outcome: 'rejected', itemIdMap: {}, notices: [] } } });
        return reply;
      }
      throw new FlowFailure(reply.status, reply.message);
    }
    const cart = reply.cart;
    if (cart.owner.kind !== 'member' || cart.owner.userId !== expectedUser) throw new FlowFailure();
    parseCartSnapshot({
      owner_id: cart.owner.userId, cart_id: cart.cartId, revision: cart.revision,
      items: cart.items.map(item => ({ id: item.id, product_id: item.productId, product_variant_id: item.variantId, quantity: item.quantity })),
      notices: cart.notices, operation: cart.operation,
    });
    parseCartProductResponse({ cartItems: cart.items, optionGroups: cart.optionGroups });
    if (cart.items.some(item => item.canSelect !== (item.stock > 0) || (item.stock > 0 && item.quantity > item.stock)) ||
      (command ? cart.operation?.requestId !== command.requestId : cart.operation !== null)) throw new FlowFailure();
    if (cartId !== null && cart.cartId !== cartId) throw new FlowFailure();
    const nextRevision = BigInt(cart.revision!);
    if (revision !== null && nextRevision < revision) throw new FlowFailure();
    await checkEpoch(ctx); check(ctx);
    cartId = cart.cartId; revision = nextRevision;
    if (command) { await local.ack(command); check(ctx); unconfirmed.delete(command.requestId); }
    publish(cart);
    return reply;
  }

  async function drainMember(ctx: Context, userId: string, readIfEmpty: boolean) {
    let applied = false;
    for (;;) {
      const queued = await local.peek(userId); check(ctx);
      const command = queued ?? [...unconfirmed.values()].find(command => command.expectedUserId === userId);
      if (!command) break;
      unconfirmed.set(command.requestId, command);
      // A drain inside this tab's own change keeps 'mutating' so storage rechecks still wait for it.
      if (store.getState().phase !== 'mutating') set({ phase: 'syncing' });
      const reply = await actions.mutate(command, { signal: ctx.signal }); check(ctx);
      if ((await consume(ctx, reply, userId, command)).status === 'ok') applied = true;
    }
    if (!applied && readIfEmpty) { const reply = await actions.read({ expectedUserId: userId }, { signal: ctx.signal }); check(ctx); await consume(ctx, reply, userId); }
  }

  async function guestCart(ctx: Context, command?: CartCommand): Promise<CartReply> {
    const document = await local.read(); holdPendingAuth(ctx, document); ctx.epoch = document.authEpoch;
    const original = document.guest.items;
    const requested = [...original.map(({ productId, variantId }) => ({ productId, variantId }))];
    const op = command?.operation;
    if (op?.kind === 'add_items') requested.push(...op.items.map(({ productId, variantId }) => ({ productId, variantId })));
    if (op?.kind === 'change_option') requested.push({ productId: op.productId, variantId: op.variantId });
    const unique = [...new Map(requested.map(item => [pairKey(item), item])).values()];
    const products = unique.length ? parseGuestCartProductResponse(await loadProducts(unique, ctx.signal)) : { cartItems: [], optionGroups: {} };
    check(ctx);
    const byPair = new Map(products.cartItems.map(item => [pairKey(item), item]));
    let lines = original.map(item => ({ ...item }));
    const notices: CartNotice[] = [];
    const itemIdMap: Record<string, string> = {};
    let accepted = false;
    const quantity = (value: number, stock: number) => {
      if (!Number.isInteger(value) || value < 1 || value > 2147483647) throw new FlowFailure('invalid');
      return getAdjustedQuantity(value, stock);
    };
    if (op?.kind === 'add_items') {
      const additions = new Map<string, CartProductInput>();
      for (const input of op.items) {
        const previous = additions.get(pairKey(input));
        additions.set(pairKey(input), { ...input, quantity: input.quantity + (previous?.quantity ?? 0) });
      }
      for (const input of additions.values()) {
        const available = byPair.get(pairKey(input));
        if (!available) { notices.push({ kind: 'unavailable', variantId: input.variantId }); continue; }
        if (available.stock === 0) { notices.push({ kind: 'sold_out', variantId: input.variantId }); continue; }
        const existing = lines.find(item => item.variantId === input.variantId);
        const desired = (existing?.quantity ?? 0) + input.quantity;
        const next = quantity(desired, available.stock); accepted = true;
        if (existing) existing.quantity = next;
        else lines.push({ ...input, id: newId(), quantity: next });
        if (next !== desired) notices.push({ kind: 'quantity_adjusted', variantId: input.variantId, before: desired, after: next });
      }
    } else if (op?.kind === 'adjust_quantity' || op?.kind === 'change_option') {
      const source = lines.find(item => item.id === op.itemId);
      if (!source) { accepted = true; notices.push({ kind: 'item_missing', itemId: op.itemId }); }
      else {
        const currentProduct = byPair.get(pairKey(source));
        if (op.kind === 'adjust_quantity') {
          if (!currentProduct || currentProduct.stock === 0) notices.push({ kind: currentProduct ? 'sold_out' : 'unavailable', itemId: source.id, variantId: source.variantId });
          else {
            const desired = Math.max(1, source.quantity + op.delta);
            source.quantity = quantity(desired, currentProduct.stock); accepted = true;
            if (desired !== source.quantity) notices.push({ kind: 'quantity_adjusted', itemId: source.id, variantId: source.variantId, before: desired, after: source.quantity });
          }
        } else {
          const target = byPair.get(pairKey(op));
          if (!currentProduct || !target || target.stock === 0 || target.styleId !== currentProduct.styleId) notices.push({ kind: 'option_rejected', itemId: source.id, variantId: op.variantId });
          else if (source.variantId === op.variantId) accepted = true;
          else {
            const existing = lines.find(item => item.variantId === op.variantId);
            const desired = source.quantity + (existing?.quantity ?? 0);
            const next = quantity(desired, target.stock);
            const targetId = existing?.id ?? newId();
            const kept = lines.filter(item => item.id !== source.id);
            const moved: CartLine = { id: targetId, productId: op.productId, variantId: op.variantId, quantity: next };
            // Preserve an existing target's display position among the remaining lines.
            if (existing) { const position = kept.findIndex(item => item.id === existing.id); lines = kept.map((item, index) => index === position ? moved : item); }
            else lines = [...kept, moved];
            itemIdMap[source.id] = targetId; accepted = true;
            if (desired !== next) notices.push({ kind: 'quantity_adjusted', itemId: targetId, variantId: op.variantId, before: desired, after: next });
          }
        }
      }
    } else if (op?.kind === 'remove_items') { lines = lines.filter(item => !op.itemIds.includes(item.id)); accepted = true; }
    const operationChanged = JSON.stringify(lines) !== JSON.stringify(original);
    lines = lines.flatMap(item => {
      const available = byPair.get(pairKey(item));
      if (!available) { notices.push({ kind: 'unavailable', itemId: item.id, variantId: item.variantId, before: item.quantity, after: 0 }); return []; }
      const next = quantity(item.quantity, available.stock);
      if (next !== item.quantity) notices.push({ kind: 'quantity_adjusted', itemId: item.id, variantId: item.variantId, before: item.quantity, after: next });
      return [{ ...item, quantity: next }];
    });
    await checkEpoch(ctx); check(ctx);
    const changed = JSON.stringify(lines) !== JSON.stringify(original);
    if (changed) {
      const saved = await local.updateGuest(document.guest.revision, lines); check(ctx);
      if (saved === 'stale') throw new FlowFailure();
    } else {
      const latest = await checkEpoch(ctx);
      if (latest.guest.revision !== document.guest.revision) throw new FlowFailure();
    }
    const cart: CartViewModel = {
      owner: { kind: 'guest' }, cartId: null, revision: String(document.guest.revision + (changed ? 1 : 0)),
      items: lines.map(item => ({ ...byPair.get(pairKey(item))!, ...item, canSelect: byPair.get(pairKey(item))!.stock > 0 })),
      optionGroups: products.optionGroups, notices,
      operation: command ? { requestId: command.requestId, outcome: operationChanged ? 'applied' : accepted ? 'noop' : 'rejected', itemIdMap, notices } : null,
    };
    publish(cart); return { status: 'ok', cart };
  }

  async function initialize(ctx: Context, initial: CartAccess) {
    let access = initial;
    for (let hops = 0; ; hops++) {
      accessState(ctx, access);
      if (access.status === 'error') throw new FlowFailure();
      if (access.status === 'restricted') { set({ phase: 'restricted' }); return; }
      listen(); // also covers a tab that reached member/guest only through a retry
      try {
        set({ phase: access.status === 'member' ? 'syncing' : 'restoring' });
        const document = await local.read(); holdPendingAuth(ctx, document); ctx.epoch = document.authEpoch; observedEpoch = document.authEpoch;
        // Resume only the same guest snapshot; items added since then may belong to someone else.
        if (mergeOwner) { await local.stageMerge(mergeOwner.userId, mergeOwner.guestRevision); check(ctx); mergeOwner = null; }
        if (access.status === 'member') {
          // Held items are retried once when this tab newly shows the account (page load, login, recovery), not on same-account rechecks.
          if (restageFor === access.userId) { await local.restageHeld(access.userId); restageFor = null; check(ctx); }
          mergeOwner = { userId: access.userId, guestRevision: document.guest.revision };
          // Merge only the guest snapshot read above; items written after it (e.g. after a logout elsewhere) stay guest.
          await local.stageMerge(access.userId, document.guest.revision); check(ctx); mergeOwner = null;
          await drainMember(ctx, access.userId, true);
        } else await guestCart(ctx);
        check(ctx); set({ phase: 'ready', message: null }); return;
      } catch (error) {
        if (!(error instanceof AccessChange) || hops >= 1) throw error instanceof AccessChange ? new FlowFailure() : error;
        restartFlow(ctx); access = error.access;
      }
    }
  }

  function launch(work: (ctx: Context) => Promise<CartReply | void>): Promise<CartReply | void> {
    abort?.abort(); abort = new AbortController();
    const ctx: Context = { generation, order: ++order, signal: abort.signal };
    const job = (async () => {
      try { return await work(ctx); }
      catch (error) {
        if (!current(ctx) || error instanceof StaleFlow) return;
        if (error instanceof AccessChange) {
          try { restartFlow(ctx); await initialize(ctx, error.access); return { status: 'access_changed' as const, access: error.access }; }
          catch (failure) { if (!current(ctx) || failure instanceof StaleFlow) return; }
        }
        const failure = error instanceof FlowFailure ? error : new FlowFailure();
        set({ phase: 'retryable', message: failure.message });
        return { status: failure.status, message: failure.message };
      }
    })();
    running = job;
    void job.finally(() => { if (running === job) running = null; });
    return job;
  }

  // A storage notice that carries another tab's auth transition must not wait behind an in-flight change.
  async function authSignalChanged(): Promise<boolean> {
    try {
      const document = await local.read();
      return !!document.authPending || (observedEpoch !== null && document.authEpoch !== observedEpoch);
    } catch { return false; }
  }

  async function refresh(reason: 'navigation' | 'auth' | 'storage' | 'retry'): Promise<void> {
    if (!active) return;
    // Another tab may ack this tab's in-flight request; recheck once the change settles instead of aborting it.
    const pendingChange = running;
    if ((reason === 'navigation' || reason === 'storage') && store.getState().phase === 'mutating' && pendingChange &&
      !(reason === 'storage' && await authSignalChanged())) {
      // Coalesced notices rerun once with the first reason; navigation and storage rechecks take the same path.
      if (!deferredRecheck) {
        const queued: Promise<void> = pendingChange.then((): Promise<void> => { if (deferredRecheck === queued) deferredRecheck = null; return refresh(reason); });
        deferredRecheck = queued;
      }
      return deferredRecheck;
    }
    const wasReady = store.getState().phase === 'ready';
    if (reason === 'auth') { pendingAuthOwner = null; signalIsNotice = false; authSignal = local.announceAuthTransition(false); reset(); set({ cart: null, selectedIds: [], access: null }); }
    // A same-account route change keeps the confirmed view (and header count) while checking in the background.
    if (!(reason === 'navigation' && wasReady)) set({ phase: 'checking', message: null });
    await launch(async ctx => {
      try { await authSignal; } catch { if (reason !== 'retry') throw new FlowFailure(); authSignal = signalIsNotice ? local.notifyAccountChange().then(() => {}) : local.announceAuthTransition(); await authSignal; }
      check(ctx);
      const settled = reason === 'retry' ? await settlePendingAuth(ctx) : null;
      const document = await local.read(); holdPendingAuth(ctx, document);
      if (observedEpoch !== null && observedEpoch !== document.authEpoch) { restartFlow(ctx); set({ cart: null, selectedIds: [], phase: 'checking' }); }
      const access = settled ?? await actions.resolveAccess({ signal: ctx.signal }); check(ctx);
      const cart = store.getState().cart;
      const pending = access.status === 'member' && (document.pendingByAccount[access.userId]?.length || [...unconfirmed.values()].some(command => command.expectedUserId === access.userId));
      if ((reason === 'navigation' || reason === 'storage') && wasReady && owner === key(access) && cart && !pending &&
        (access.status === 'member' ? document.guest.items.length === 0 : access.status === 'guest' && cart.revision === String(document.guest.revision))) {
        observedEpoch = document.authEpoch; set({ access, phase: 'ready', message: null }); return;
      }
      await initialize(ctx, access);
    });
  }

  async function mutate(operation: CartOperation): Promise<CartCommandReply> {
    const state = store.getState();
    if (!active || state.phase !== 'ready' || !state.access || !['member', 'guest'].includes(state.access.status)) return { status: 'retryable', message: retryMessage };
    const parsed = cartCommandSchema.safeParse({ version: 1, requestId: nil, expectedUserId: nil, operation });
    if (!parsed.success) return { status: 'invalid', message: '장바구니 요청 형식을 확인해주세요.' };
    set({ phase: 'mutating', message: null });
    let requestId: string | undefined;
    // This change's confirmed result; a later restart (e.g. while draining another tab's request) clears settledRequests.
    let ownResult: CartViewModel['operation'] | undefined;
    const result = await launch(async ctx => {
      const command = cartCommandSchema.parse({ version: 1, requestId: newId(), expectedUserId: state.access!.status === 'member' ? state.access!.userId : nil, operation: parsed.data.operation });
      let reply: CartReply;
      if (state.access!.status === 'member') {
        const document = await local.read(); holdPendingAuth(ctx, document); ctx.epoch = document.authEpoch;
        // Another tab's request (or a staged merge) still queued goes first under its own ID; then this change queues.
        for (let attempt = 0; ; attempt++) {
          try { await local.enqueue(command); break; }
          catch (error) {
            if (!(error instanceof Error && error.message === 'CART_LOCAL_PENDING') || attempt >= 2) throw error;
            check(ctx); await drainMember(ctx, state.access!.userId, false);
          }
        }
        requestId = command.requestId; unconfirmed.set(command.requestId, command); check(ctx);
        reply = await actions.mutate(command, { signal: ctx.signal }); check(ctx);
        const consumed = await consume(ctx, reply, state.access!.userId, command);
        if (consumed.status === 'ok') ownResult = consumed.cart.operation ?? undefined;
        await drainMember(ctx, state.access!.userId, consumed.status !== 'ok');
      } else reply = await guestCart(ctx, command);
      check(ctx); set({ phase: 'ready', message: null }); return reply;
    });
    const reply = result ?? { status: 'retryable' as const, message: retryMessage };
    // A same-account auth signal mid-change restarts the flow and replays the request; report its settled result, not an account change.
    if (requestId && reply.status === 'access_changed' && state.access?.status === 'member' &&
      reply.access.status === 'member' && reply.access.userId === state.access.userId) {
      const settled = store.getState().settledRequests[requestId] ?? ownResult;
      const cart = store.getState().cart;
      if (settled && cart && store.getState().phase === 'ready') return { status: 'ok', cart: { ...cart, operation: settled }, requestId };
      return { status: 'retryable', message: retryMessage, requestId };
    }
    return requestId ? { ...reply, requestId } : reply;
  }

  const controller: CartController = {
    start(access) {
      if (active && starting?.key === key(access) && starting.generation === generation) return starting.promise;
      // Props that only catch up with an account this tab already shows (e.g. learned from another tab) are its new snapshot.
      if (active && owner === key(access) && access.status !== 'error') snapshotOwner = key(access);
      if (active && owner === key(access) && store.getState().phase === 'ready') return Promise.resolve();
      // Same-account props re-created mid change/sync (e.g. a cookie-refreshing Server Action) must not abort it.
      if (active && owner === key(access) && running && ['mutating', 'syncing', 'restoring'].includes(store.getState().phase)) return running.then(() => {});
      // Only the initiating tab can complete its pending transition from new
      // server props. Another tab's stale props must never unlock that transition.
      if (pendingAuthOwner !== null && pendingAuthOwner !== key(access)) {
        pendingAuthOwner = null; signalIsNotice = false; authSignal = local.announceAuthTransition(false);
      } else if (access.status !== 'error' && ((snapshotOwner !== null && snapshotOwner !== key(access)) ||
        (pendingAuthOwner === null && access.status === 'member' && shownAccount !== null && shownAccount !== key(access)))) {
        // A running tab's real account change (e.g. a login redirect) may write nothing else; notify other tabs once.
        // Compared with what it showed too: a tab that followed another tab's logout still holds the old props.
        // Only a login is caught this way (logouts announce themselves); stale guest props after a login must not notify.
        // Stale props during another tab's pending transition must not release it, so the notice is conditional.
        signalIsNotice = true; authSignal = local.notifyAccountChange().then(() => {});
      }
      // An error snapshot says nothing about the account; keep the last known owner so a return is not a change.
      if (access.status !== 'error') snapshotOwner = key(access);
      // Only a fresh mount (page entry, refresh, remount) is a re-entry; new props for a running tab are not.
      const reentry = !active;
      active = true;
      const promise = launch(async ctx => {
        accessState(ctx, access);
        if (access.status === 'member' || access.status === 'guest') listen();
        await authSignal; check(ctx);
        const settled = reentry ? await settlePendingAuth(ctx) : null;
        await initialize(ctx, settled ?? access);
      }).then(() => {});
      starting = { key: key(access), generation, promise };
      return promise;
    },
    recheck: reason => refresh(reason),
    async enterCart() {
      set({ selectedIds: [] });
      const seen = published;
      // Share a running flow's item read, but an access-only recheck that kept the cache does not count as entry.
      if (running) { await running; if (published !== seen) return; }
      // No confirmed account (e.g. another tab's pending login) leaves its retry state rather than a spinner nothing resolves.
      const access = store.getState().access;
      if (!active || !access) return;
      set({ phase: 'restoring' });
      await launch(ctx => initialize(ctx, access));
    },
    addItems: items => mutate({ kind: 'add_items', items }),
    adjustQuantity: (itemId, delta) => mutate({ kind: 'adjust_quantity', itemId, delta }),
    changeOption: (itemId, productId, variantId) => mutate({ kind: 'change_option', itemId, productId, variantId }),
    removeItems: itemIds => mutate({ kind: 'remove_items', itemIds }),
    retry: () => refresh('retry'),
    beginAuthTransition() {
      if (!active) return;
      pendingAuthOwner = owner ?? snapshotOwner;
      reset(); set({ phase: 'checking', access: null, cart: null, selectedIds: [], message: null });
      const token = generation;
      signalIsNotice = false; authSignal = local.announceAuthTransition(true);
      void authSignal.catch(() => { if (active && token === generation) set({ phase: 'retryable', message: retryMessage }); });
    },
    dispose() {
      active = false; reset(); unsubscribe?.(); unsubscribe = null; running = null; deferredRecheck = null; shownAccount = null; restageFor = null;
      set({ phase: 'checking', cart: null, access: null, selectedIds: [] });
    },
  };
  return controller;
}
