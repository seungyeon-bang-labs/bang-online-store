import 'server-only';

import { cartInvalidMessage as invalidMessage, type CartAccess, type CartReply } from '@/domains/cart/cart.contract';

// Same ceiling as the Server Action default this transport replaces.
export const CART_BODY_LIMIT = 1_048_576;

const replyStatus: Record<CartReply['status'], number> = {
  ok: 200,
  access_changed: 200,
  invalid: 400,
  conflict: 409,
  retryable: 503,
};

export function cartJson(value: CartAccess | CartReply, status = 200): Response {
  return Response.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export function cartReplyJson(reply: CartReply): Response {
  return cartJson(reply, replyStatus[reply.status]);
}

const invalid = (status: number) => cartJson({ status: 'invalid', message: invalidMessage }, status);

// Compare against the host the browser addressed (as Next's Server Action
// origin check does), not request.url, which is internal behind a proxy.
function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') return false;
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host'))?.split(',')[0]?.trim();
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Reads the actual bytes up to the limit; Content-Length is not trusted.
async function readLimited(request: Request): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > CART_BODY_LIMIT) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function readCartPost(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; response: Response }> {
  if (!isSameOrigin(request)) return { ok: false, response: invalid(403) };
  if (!/^application\/json(\s*;|$)/i.test(request.headers.get('content-type') ?? '')) {
    return { ok: false, response: invalid(400) };
  }
  const text = await readLimited(request);
  if (text === null) return { ok: false, response: invalid(413) };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, response: invalid(400) };
  }
}
