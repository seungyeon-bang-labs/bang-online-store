import { z } from 'zod';
import { maxCartQuantity as maxQuantity, type CartCommand } from './cart.contract';
import type { CartSnapshotDTO } from './cart.dto';

const maxRevision = '9223372036854775807';
export const numericIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const quantitySchema = z.number().int().positive().max(maxQuantity);

export const productInputsSchema = z.array(z.strictObject({
  productId: numericIdSchema,
  variantId: numericIdSchema,
  quantity: quantitySchema,
})).min(1).superRefine((items, ctx) => {
  const quantities = new Map<number, number>();
  for (const [index, item] of items.entries()) {
    const sum = (quantities.get(item.variantId) ?? 0) + item.quantity;
    if (sum > maxQuantity) {
      ctx.addIssue({
        code: 'custom',
        path: [index, 'quantity'],
        message: '같은 옵션의 합산 수량이 저장 가능한 범위를 초과했습니다.',
      });
      return;
    }
    quantities.set(item.variantId, sum);
  }
});

export const cartCommandSchema: z.ZodType<CartCommand> = z.strictObject({
  version: z.literal(1),
  requestId: z.uuid(),
  expectedUserId: z.uuid(),
  operation: z.discriminatedUnion('kind', [
    z.strictObject({
      kind: z.enum(['merge_guest', 'add_items']),
      items: productInputsSchema,
    }),
    z.strictObject({
      kind: z.literal('adjust_quantity'),
      itemId: z.uuid(),
      delta: z.union([z.literal(1), z.literal(-1)]),
    }),
    z.strictObject({
      kind: z.literal('change_option'),
      itemId: z.uuid(),
      productId: numericIdSchema,
      variantId: numericIdSchema,
    }),
    z.strictObject({
      kind: z.literal('remove_items'),
      itemIds: z.array(z.uuid()).min(1),
    }),
  ]),
});

export const cartReadSchema = z.strictObject({ expectedUserId: z.uuid() });

const noticeSchema = z.strictObject({
  kind: z.enum(['quantity_adjusted', 'unavailable', 'sold_out', 'item_missing', 'option_rejected']),
  variantId: numericIdSchema.optional(),
  itemId: z.uuid().optional(),
  before: z.number().int().nonnegative().max(maxQuantity).optional(),
  after: z.number().int().nonnegative().max(maxQuantity).optional(),
});

const revisionSchema = z.string().regex(/^(0|[1-9]\d*)$/).refine(
  value => value.length < maxRevision.length ||
    (value.length === maxRevision.length && value <= maxRevision),
  '장바구니 버전이 저장 가능한 범위를 초과했습니다.',
);

const operationSchema = z.strictObject({
  requestId: z.uuid(),
  outcome: z.enum(['applied', 'noop', 'rejected']),
  itemIdMap: z.record(z.uuid(), z.uuid()),
  notices: z.array(noticeSchema),
}).nullable();

const snapshotSchema: z.ZodType<CartSnapshotDTO> = z.strictObject({
  owner_id: z.uuid(),
  cart_id: z.uuid(),
  revision: revisionSchema,
  items: z.array(z.strictObject({
    id: z.uuid(),
    product_id: numericIdSchema,
    product_variant_id: numericIdSchema,
    quantity: quantitySchema,
  })),
  notices: z.array(noticeSchema),
  operation: operationSchema,
});

export function parseCartSnapshot(value: unknown): CartSnapshotDTO {
  return snapshotSchema.parse(value);
}

// The member cart as the browser receives it; product fields are checked by the product response schema.
const memberCartViewSchema = z.object({
  owner: z.strictObject({ kind: z.literal('member'), userId: z.uuid() }),
  cartId: z.uuid(),
  revision: revisionSchema,
  items: z.array(z.object({ id: z.uuid(), quantity: quantitySchema, canSelect: z.boolean() })),
  notices: z.array(noticeSchema),
  operation: operationSchema,
});

export function parseMemberCartView(value: unknown): void {
  memberCartViewSchema.parse(value);
}
