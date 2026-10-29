import { z } from 'zod';
import type { CartLine } from './contract';
import { numericIdSchema, quantitySchema } from './schema';

const storageKey = 'bang-cart:v2';
const idSchema = z.uuid();
const guestItemsSchema = z
  .array(
    z.strictObject({
      id: idSchema,
      productId: numericIdSchema,
      variantId: numericIdSchema,
      quantity: quantitySchema,
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

export type GuestDocument = {
  version: 2;
  items: readonly CartLine[];
  // Request ID of the login merge for exactly these items; any change to the items drops it.
  mergeId?: string;
};

const documentSchema: z.ZodType<GuestDocument> = z.strictObject({
  version: z.literal(2),
  items: guestItemsSchema,
  mergeId: idSchema.optional(),
});

export interface CartLocalAdapter {
  // An absent or unreadable document reads as empty; missing storage throws CART_LOCAL_UNAVAILABLE.
  read(): GuestDocument;
  write(items: readonly CartLine[]): void;
  ensureMergeId(newId: () => string): string;
  // Empties the guest cart only while it still carries this merge ID.
  clearIfMergeId(mergeId: string): boolean;
}

type LocalStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function createCartLocalAdapter(
  dependencies: { storage?: LocalStorage | null } = {},
): CartLocalAdapter {
  function storage(): LocalStorage {
    const value =
      dependencies.storage === undefined
        ? globalThis.localStorage
        : dependencies.storage;
    if (!value) throw new Error('CART_LOCAL_UNAVAILABLE');
    return value;
  }

  function read(): GuestDocument {
    const raw = storage().getItem(storageKey);
    if (raw === null) return { version: 2, items: [] };
    try {
      return documentSchema.parse(JSON.parse(raw));
    } catch {
      return { version: 2, items: [] };
    }
  }

  function save(document: GuestDocument) {
    storage().setItem(storageKey, JSON.stringify(documentSchema.parse(document)));
  }

  return {
    read,
    write(items) {
      save({ version: 2, items: guestItemsSchema.parse(items) });
    },
    ensureMergeId(newId) {
      const document = read();
      if (document.mergeId) return document.mergeId;
      const mergeId = newId();
      save({ ...document, mergeId });
      return mergeId;
    },
    clearIfMergeId(mergeId) {
      if (read().mergeId !== mergeId) return false;
      save({ version: 2, items: [] });
      return true;
    },
  };
}
