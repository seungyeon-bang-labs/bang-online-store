import { mutateCart } from '@/app/cart-actions';
import { cartReplyJson, readCartPost } from '../http';

export async function POST(request: Request) {
  const body = await readCartPost(request);
  if (!body.ok) return body.response;
  return cartReplyJson(await mutateCart(body.value));
}
