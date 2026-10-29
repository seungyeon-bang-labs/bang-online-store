import { z } from 'zod';
import type { CartProductRequestItem, CartProductResponse } from '@/domains/cart/api';
import { cartProductRequestSchema, numericIdSchema as id } from '@/domains/cart/schema';
import { pairKey } from '@/domains/cart/guest';
import { cartRequestTimeoutMs } from './cart.http-client';

const stock = z.number().int().nonnegative().max(2147483647);
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const responseSchema: z.ZodType<CartProductResponse> = z.object({
  cartItems: z.array(z.object({
    productId: id, variantId: id, styleId: id, name: z.string(), color: z.string(), thumbnailUrl: z.string().min(1),
    price: money, discountRate: z.number().min(0).max(100), priceOffset: money, stock, size: z.string().min(1),
  })),
  optionGroups: z.record(z.string().regex(/^[1-9]\d*$/), z.array(z.object({
    productId: id, styleId: id, color: z.object({ id, label: z.string(), hex: z.string() }),
    variants: z.array(z.object({ id, size: z.string().min(1), stock, priceOffset: money })),
  }))),
});

export function parseCartProductResponse(value: unknown): CartProductResponse {
  const result = responseSchema.parse(value);
  for (const [style, products] of Object.entries(result.optionGroups)) {
    if (products.some(product => product.styleId !== Number(style))) throw new Error('상품 옵션 정보를 확인하지 못했습니다.');
  }
  return result;
}

// Member snapshots are validated by the server mapper. Guest HTTP snapshots must
// agree with their own option before cleanup or local persistence.
export function parseGuestCartProductResponse(value: unknown): CartProductResponse {
  const result = parseCartProductResponse(value);
  for (const item of result.cartItems) {
    const product = result.optionGroups[item.styleId]?.find(product => product.productId === item.productId);
    const variant = product?.variants.find(variant => variant.id === item.variantId);
    if (!variant || variant.stock !== item.stock || variant.size !== item.size || variant.priceOffset !== item.priceOffset) {
      throw new Error('상품 옵션 정보를 확인하지 못했습니다.');
    }
  }
  return result;
}

export async function loadCartProducts(items: readonly CartProductRequestItem[], timeoutMs = cartRequestTimeoutMs): Promise<CartProductResponse> {
  const input = cartProductRequestSchema.parse(items);
  const reply = await fetch('/api/cart/products', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input), cache: 'no-store', signal: AbortSignal.timeout(timeoutMs),
  });
  if (!reply.ok) throw new Error('장바구니 상품을 불러오지 못했습니다.');
  const result = parseGuestCartProductResponse(await reply.json());
  const requested = new Set(input.map(pairKey));
  if (result.cartItems.some(item => !requested.has(pairKey(item)))) throw new Error('상품 응답이 요청과 일치하지 않습니다.');
  return result;
}
