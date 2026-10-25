import { z } from 'zod';
import type { CartCommand, CartLine, CartProductInput } from './cart.contract';
import { cartCommandSchema, productInputsSchema } from './cart.schema';

const storageKey = 'bang-cart:v1';
const lockName = 'bang-cart:local';
const revisionSchema = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER);
const idSchema = z.uuid();
const numericIdSchema = z
  .number()
  .int()
  .positive()
  .max(Number.MAX_SAFE_INTEGER);
const guestItemsSchema = z
  .array(
    z.strictObject({
      id: idSchema,
      productId: numericIdSchema,
      variantId: numericIdSchema,
      quantity: z.number().int().positive().max(2147483647),
    }),
  )
  .superRefine((items, ctx) => {
    const ids = new Set<string>();
    for (const [index, item] of items.entries()) {
      if (ids.has(item.id))
        ctx.addIssue({
          code: 'custom',
          path: [index, 'id'],
          message: 'Duplicate cart item ID',
        });
      ids.add(item.id);
    }
  });

// Held items must stay a valid merge payload, so they share the command input rules.
const heldItemsSchema = productInputsSchema;

export type CartLocalDocument = {
  version: 1;
  authEpoch: number;
  authPending?: boolean;
  guest: { revision: number; items: readonly CartLine[] };
  pendingByAccount: Record<string, readonly CartCommand[]>;
  // Items of a server-rejected login merge, bound to the account like its pending requests.
  heldByAccount?: Record<string, readonly CartProductInput[]>;
};

export interface CartLocalAdapter {
  read(): Promise<CartLocalDocument>;
  updateGuest(
    expectedRevision: number,
    items: readonly CartLine[],
  ): Promise<'saved' | 'stale'>;
  // With expectedGuestRevision, moves nothing unless the guest cart is still exactly that revision.
  stageMerge(
    userId: string,
    expectedGuestRevision?: number,
  ): Promise<CartCommand | null>;
  // Releases a rejected merge and holds its items for that account only (never the shared guest cart); false if already settled.
  holdMerge(command: CartCommand): Promise<boolean>;
  // Queues an account's held items as a new merge; called only when that account enters again.
  restageHeld(userId: string): Promise<CartCommand | null>;
  enqueue(command: CartCommand): Promise<void>;
  peek(userId: string): Promise<CartCommand | null>;
  ack(command: CartCommand): Promise<void>;
  announceAuthTransition(pending?: boolean): Promise<void>;
  // Releases a pending transition only if it is still the one observed at expectedEpoch.
  completeAuthTransition(expectedEpoch: number): Promise<boolean>;
  // Signals a settled account change to other tabs unless another transition is still pending.
  notifyAccountChange(): Promise<boolean>;
  subscribe(listener: () => void): () => void;
}

type LocalStorage = Pick<Storage, 'getItem' | 'setItem'>;
type LocalLocks = { request<T>(name: string, callback: () => T): Promise<T> };
type LocalStorageEvent = {
  key: string | null;
  storageArea?: LocalStorage | null;
};
type LocalEvents = {
  subscribe(listener: (event: LocalStorageEvent) => void): () => void;
};
type LocalDependencies = {
  storage?: LocalStorage | null;
  locks?: LocalLocks | null;
  events?: LocalEvents | null;
  newId?: () => string;
};

const documentSchema: z.ZodType<CartLocalDocument> = z
  .strictObject({
    version: z.literal(1),
    authEpoch: revisionSchema,
    authPending: z.boolean().optional(),
    guest: z.strictObject({
      revision: revisionSchema,
      items: guestItemsSchema,
    }),
    pendingByAccount: z.record(idSchema, z.array(cartCommandSchema)),
    heldByAccount: z.record(idSchema, heldItemsSchema).optional(),
  })
  .superRefine((document, ctx) => {
    for (const [userId, commands] of Object.entries(
      document.pendingByAccount,
    )) {
      const ids = new Set<string>();
      for (const [index, command] of commands.entries()) {
        if (command.expectedUserId !== userId || ids.has(command.requestId)) {
          ctx.addIssue({
            code: 'custom',
            path: ['pendingByAccount', userId, index],
            message: 'Invalid account-bound cart request',
          });
        }
        ids.add(command.requestId);
      }
    }
  });

function emptyDocument(): CartLocalDocument {
  return {
    version: 1,
    authEpoch: 0,
    guest: { revision: 0, items: [] },
    pendingByAccount: {},
  };
}

function nextRevision(value: number): number {
  return revisionSchema.parse(value + 1);
}

function sameCommand(left: CartCommand, right: CartCommand): boolean {
  // Parsed schemas give object keys a stable order; array content/order stays fixed.
  return JSON.stringify(left) === JSON.stringify(right);
}

export function createCartLocalAdapter(
  dependencies: LocalDependencies = {},
): CartLocalAdapter {
  function storage(): LocalStorage {
    const value =
      dependencies.storage === undefined
        ? globalThis.localStorage
        : dependencies.storage;
    if (!value) throw new Error('CART_LOCAL_UNAVAILABLE');
    return value;
  }

  async function locked<T>(
    work: (document: CartLocalDocument, target: LocalStorage) => T,
  ): Promise<T> {
    const locks =
      dependencies.locks === undefined
        ? globalThis.navigator?.locks
        : dependencies.locks;
    if (!locks) throw new Error('CART_LOCAL_UNAVAILABLE');
    return locks.request(lockName, () => {
      const target = storage();
      const raw = target.getItem(storageKey);
      const document =
        raw === null ? emptyDocument() : documentSchema.parse(JSON.parse(raw));
      return work(document, target);
    });
  }

  function save(target: LocalStorage, document: CartLocalDocument): void {
    target.setItem(storageKey, JSON.stringify(document));
  }

  return {
    read() {
      return locked(document => document);
    },
    async updateGuest(expectedRevision, items) {
      const revision = revisionSchema.parse(expectedRevision);
      const captured = guestItemsSchema.parse(items);
      return locked((document, target) => {
        if (document.guest.revision !== revision) return 'stale';
        document.guest = { revision: nextRevision(revision), items: captured };
        save(target, document);
        return 'saved';
      });
    },
    async stageMerge(userId, expectedGuestRevision) {
      const account = idSchema.parse(userId);
      return locked((document, target) => {
        if (document.guest.items.length === 0) return null;
        if (
          expectedGuestRevision !== undefined &&
          document.guest.revision !== expectedGuestRevision
        )
          return null;
        const command = cartCommandSchema.parse({
          version: 1,
          requestId: dependencies.newId
            ? dependencies.newId()
            : globalThis.crypto.randomUUID(),
          expectedUserId: account,
          operation: {
            kind: 'merge_guest',
            items: document.guest.items.map(
              ({ productId, variantId, quantity }) => ({
                productId,
                variantId,
                quantity,
              }),
            ),
          },
        });
        const pending = document.pendingByAccount[account] ?? [];
        if (pending.some(entry => entry.requestId === command.requestId))
          throw new Error('CART_LOCAL_CONFLICT');
        document.pendingByAccount[account] = [...pending, command];
        document.guest = {
          revision: nextRevision(document.guest.revision),
          items: [],
        };
        save(target, document);
        return command;
      });
    },
    async holdMerge(input) {
      const command = cartCommandSchema.parse(input);
      if (command.operation.kind !== 'merge_guest')
        throw new Error('CART_LOCAL_CONFLICT');
      const returned = command.operation.items;
      const account = command.expectedUserId;
      return locked((document, target) => {
        const pending = document.pendingByAccount[command.expectedUserId] ?? [];
        const index = pending.findIndex(
          entry => entry.requestId === command.requestId,
        );
        if (index < 0) return false;
        if (!sameCommand(pending[index], command))
          throw new Error('CART_LOCAL_CONFLICT');
        const remaining = pending.filter((_, position) => position !== index);
        if (remaining.length === 0)
          delete document.pendingByAccount[command.expectedUserId];
        else document.pendingByAccount[command.expectedUserId] = remaining;
        const items = (document.heldByAccount?.[account] ?? []).map(item => ({ ...item }));
        for (const item of returned) {
          const existing = items.find(line => line.variantId === item.variantId);
          if (existing)
            existing.quantity = Math.min(
              existing.quantity + item.quantity,
              2147483647,
            );
          else items.push({ ...item });
        }
        document.heldByAccount = {
          ...document.heldByAccount,
          [account]: heldItemsSchema.parse(items),
        };
        save(target, document);
        return true;
      });
    },
    async restageHeld(userId) {
      const account = idSchema.parse(userId);
      return locked((document, target) => {
        const held = document.heldByAccount?.[account];
        if (!held?.length) return null;
        const command = cartCommandSchema.parse({
          version: 1,
          requestId: dependencies.newId
            ? dependencies.newId()
            : globalThis.crypto.randomUUID(),
          expectedUserId: account,
          operation: { kind: 'merge_guest', items: held },
        });
        const pending = document.pendingByAccount[account] ?? [];
        if (pending.some(entry => entry.requestId === command.requestId))
          throw new Error('CART_LOCAL_CONFLICT');
        document.pendingByAccount[account] = [...pending, command];
        const rest = { ...document.heldByAccount };
        delete rest[account];
        if (Object.keys(rest).length) document.heldByAccount = rest;
        else delete document.heldByAccount;
        save(target, document);
        return command;
      });
    },
    async enqueue(input) {
      const command = cartCommandSchema.parse(input);
      return locked((document, target) => {
        const pending = document.pendingByAccount[command.expectedUserId] ?? [];
        const existing = pending.find(
          entry => entry.requestId === command.requestId,
        );
        if (existing) {
          if (!sameCommand(existing, command))
            throw new Error('CART_LOCAL_CONFLICT');
          return;
        }
        if (pending.length > 0) throw new Error('CART_LOCAL_PENDING');
        document.pendingByAccount[command.expectedUserId] = [command];
        save(target, document);
      });
    },
    async peek(userId) {
      const account = idSchema.parse(userId);
      return locked(
        document => document.pendingByAccount[account]?.[0] ?? null,
      );
    },
    async ack(input) {
      const command = cartCommandSchema.parse(input);
      return locked((document, target) => {
        const pending = document.pendingByAccount[command.expectedUserId] ?? [];
        const index = pending.findIndex(
          entry => entry.requestId === command.requestId,
        );
        if (index < 0) return;
        if (!sameCommand(pending[index], command))
          throw new Error('CART_LOCAL_CONFLICT');
        const remaining = pending.filter((_, position) => position !== index);
        if (remaining.length === 0)
          delete document.pendingByAccount[command.expectedUserId];
        else document.pendingByAccount[command.expectedUserId] = remaining;
        save(target, document);
      });
    },
    announceAuthTransition(pending = false) {
      return locked((document, target) => {
        document.authEpoch = nextRevision(document.authEpoch);
        document.authPending = pending;
        save(target, document);
      });
    },
    completeAuthTransition(expectedEpoch) {
      return locked((document, target) => {
        if (!document.authPending || document.authEpoch !== expectedEpoch)
          return false;
        document.authEpoch = nextRevision(document.authEpoch);
        document.authPending = false;
        save(target, document);
        return true;
      });
    },
    notifyAccountChange() {
      return locked((document, target) => {
        if (document.authPending) return false;
        document.authEpoch = nextRevision(document.authEpoch);
        document.authPending = false;
        save(target, document);
        return true;
      });
    },
    subscribe(listener) {
      const target = storage();
      const onStorage = (event: LocalStorageEvent) => {
        if (
          (event.key === storageKey || event.key === null) &&
          (event.storageArea === undefined || event.storageArea === target)
        )
          listener();
      };
      if (dependencies.events !== undefined) {
        if (!dependencies.events) throw new Error('CART_LOCAL_UNAVAILABLE');
        return dependencies.events.subscribe(onStorage);
      }
      if (typeof window === 'undefined')
        throw new Error('CART_LOCAL_UNAVAILABLE');
      window.addEventListener('storage', onStorage);
      return () => window.removeEventListener('storage', onStorage);
    },
  };
}
