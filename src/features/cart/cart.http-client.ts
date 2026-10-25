import { z } from 'zod';
import type { CartAccess, CartActionPort, CartReply, CartRequestOptions } from '@/domains/cart/cart.contract';

const retryMessage = '장바구니를 확인하지 못했습니다. 같은 요청으로 다시 시도해주세요.';

const accessSchema: z.ZodType<CartAccess> = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('guest') }),
  z.strictObject({ status: z.literal('member'), userId: z.uuid() }),
  z.strictObject({ status: z.literal('restricted'), reason: z.enum(['unverified', 'missing', 'unavailable']) }),
  z.strictObject({ status: z.literal('error'), message: z.string() }),
]);

// Only the envelope is checked here; the controller validates the cart snapshot itself.
const replySchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ok'), cart: z.looseObject({}) }),
  z.object({ status: z.literal('access_changed'), access: accessSchema }),
  z.object({ status: z.enum(['retryable', 'invalid', 'conflict']), message: z.string() }),
]);

// HTTP status each reply status may arrive with (invalid covers 400/403/413).
const allowedStatus: Record<CartReply['status'], readonly number[]> = {
  ok: [200],
  access_changed: [200],
  invalid: [400, 403, 413],
  conflict: [409],
  retryable: [503],
};

async function readJson(response: Response): Promise<unknown> {
  if (!/application\/json/i.test(response.headers.get('content-type') ?? '')) throw new Error('CART_HTTP_NOT_JSON');
  return response.json();
}

export function createCartHttpClient(fetcher: typeof fetch = (...args) => globalThis.fetch(...args)): CartActionPort {
  const request = (url: string, options: CartRequestOptions | undefined, body?: unknown) => fetcher(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
    signal: options?.signal,
  });

  async function post(url: string, body: unknown, options?: CartRequestOptions): Promise<CartReply> {
    try {
      const response = await request(url, options, body);
      const parsed = replySchema.safeParse(await readJson(response));
      if (!parsed.success || !allowedStatus[parsed.data.status].includes(response.status)) {
        return { status: 'retryable', message: retryMessage };
      }
      // Origin and body-size refusals are transport problems, not a server verdict on the request: keep it pending.
      if (response.status === 403 || response.status === 413) return { status: 'retryable', message: retryMessage };
      return parsed.data as CartReply;
    } catch {
      // Network loss and abort keep the pending request for same-ID recovery.
      return { status: 'retryable', message: retryMessage };
    }
  }

  return {
    async resolveAccess(options) {
      try {
        const response = await request('/api/cart/access', options);
        const parsed = accessSchema.safeParse(await readJson(response));
        if (response.status !== 200 || !parsed.success) return { status: 'error', message: retryMessage };
        return parsed.data;
      } catch {
        return { status: 'error', message: retryMessage };
      }
    },
    read: (input, options) => post('/api/cart/read', input, options),
    mutate: (command, options) => post('/api/cart/operations', command, options),
  };
}
