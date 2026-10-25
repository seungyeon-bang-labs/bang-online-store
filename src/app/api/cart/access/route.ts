import { resolveCartAccess } from '@/app/cart-actions';
import { cartJson } from '../http';

export const dynamic = 'force-dynamic';

export async function GET() {
  return cartJson(await resolveCartAccess());
}
