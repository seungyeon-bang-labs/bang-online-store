import { z } from 'zod';
import { cartRetryMessage, type CartAccess, type CartActionPort, type CartReply } from '@/domains/cart/contract';

// A cart request with no answer by then is cut off and handled as a lost reply, so one stuck request cannot lock the cart.
export const cartRequestTimeoutMs = 15_000;

const accessSchema: z.ZodType<CartAccess> = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('guest') }),
  z.strictObject({ status: z.literal('member'), userId: z.uuid() }),
  z.strictObject({ status: z.literal('restricted') }),
  z.strictObject({ status: z.literal('error'), message: z.string() }),
]);

// Only the envelope is checked here; the controller validates the cart snapshot itself (cart-controller checked()).
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

export function createCartHttpClient(fetcher: typeof fetch = (...args) => globalThis.fetch(...args), timeoutMs = cartRequestTimeoutMs): CartActionPort {
  const request = (url: string, body?: unknown) => fetcher(url, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  });

  async function post(url: string, body: unknown): Promise<CartReply> {
    try {
      const response = await request(url, body);
      const parsed = replySchema.safeParse(await readJson(response));
      if (!parsed.success || !allowedStatus[parsed.data.status].includes(response.status)) {
        return { status: 'retryable', message: cartRetryMessage };
      }
      // Origin and body-size refusals are transport problems, not a server verdict on the request.
      if (response.status === 403 || response.status === 413) return { status: 'retryable', message: cartRetryMessage };
      return parsed.data as CartReply;
    } catch {
      // Network loss, abort and the timeout all arrive as a lost reply.
      return { status: 'retryable', message: cartRetryMessage };
    }
  }

  return {
    async resolveAccess() {
      try {
        const response = await request('/api/cart/access');
        const parsed = accessSchema.safeParse(await readJson(response));
        if (response.status !== 200 || !parsed.success) return { status: 'error', message: cartRetryMessage };
        return parsed.data;
      } catch {
        return { status: 'error', message: cartRetryMessage };
      }
    },
    read: input => post('/api/cart/read', input),
    mutate: command => post('/api/cart/operations', command),
  };
}
