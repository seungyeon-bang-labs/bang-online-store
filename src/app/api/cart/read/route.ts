import { readCart } from '@/app/cart-actions';
import { cartReplyJson, readCartPost } from '../http';

// get_cart creates and cleans the cart row, so reads are POST.
export async function POST(request: Request) {
  const body = await readCartPost(request);
  if (!body.ok) return body.response;
  return cartReplyJson(await readCart(body.value));
}
