import { z } from 'zod';

export type PlaceOrderRejection =
  | 'price_changed'
  | 'out_of_stock'
  | 'product_unavailable'
  | 'cart_changed'
  | 'address_missing'
  | 'address_incomplete'
  | 'zero_total'
  | 'access_denied'
  | 'failed';

export type PlaceOrderResult =
  | { status: 'placed'; orderId: string }
  | { status: 'rejected'; reason: PlaceOrderRejection; totalAmount?: number };

export interface PlaceOrderInput {
  userId: string;
  requestId: string;
  cartItemIds: string[];
  addressId: string;
  expectedTotal: number;
}

export const MAX_ORDER_LINES = 100;

export type OrderBlock = 'too_many_lines' | 'zero_total';

/** Why an order cannot be paid before it is sent; null when it can. */
export function getOrderBlock({ lineCount, totalAmount }: {
  lineCount: number;
  totalAmount: number;
}): OrderBlock | null {
  if (lineCount > MAX_ORDER_LINES) return 'too_many_lines';
  if (totalAmount <= 0) return 'zero_total';
  return null;
}

// place_order takes at most MAX_ORDER_LINES lines and an int4 total.
export const placeOrderRequestSchema = z.strictObject({
  requestId: z.uuid(),
  cartItemIds: z.array(z.uuid()).min(1).max(MAX_ORDER_LINES),
  addressId: z.uuid(),
  expectedTotal: z.number().int().positive().max(2_147_483_647),
});

export interface OrderPlacementRepository {
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
}

const REJECTIONS = new Map<string, PlaceOrderRejection>(Object.entries({
  ORDER_PRICE_CHANGED: 'price_changed',
  ORDER_OUT_OF_STOCK: 'out_of_stock',
  ORDER_PRODUCT_UNAVAILABLE: 'product_unavailable',
  ORDER_CART_ITEM_NOT_FOUND: 'cart_changed',
  ORDER_ADDRESS_NOT_FOUND: 'address_missing',
  ORDER_ADDRESS_INCOMPLETE: 'address_incomplete',
  ORDER_ZERO_TOTAL: 'zero_total',
  CART_ACCESS_DENIED: 'access_denied',
}));

function readTotalAmount(details: string | undefined): number | undefined {
  try {
    const { totalAmount } = JSON.parse(details ?? '') as { totalAmount?: unknown };
    return Number.isSafeInteger(totalAmount) ? (totalAmount as number) : undefined;
  } catch {
    return undefined;
  }
}

/** Maps a place_order error to a reason; anything unknown stays a generic failure. */
export function toPlaceOrderRejection(error: {
  message?: string;
  details?: string;
}): Extract<PlaceOrderResult, { status: 'rejected' }> {
  const reason = REJECTIONS.get(error.message ?? '') ?? 'failed';
  if (reason !== 'price_changed') return { status: 'rejected', reason };

  return { status: 'rejected', reason, totalAmount: readTotalAmount(error.details) };
}
