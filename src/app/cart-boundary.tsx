import 'server-only';

import type { ReactNode } from 'react';
import { CartProvider } from '@/features/cart/cart-provider';
import { resolveCartAccess } from './cart-actions';

// Only serializable access crosses to the client; the Provider creates its own HTTP port.
export async function CartBoundary({ children }: { children: ReactNode }) {
  const access = await resolveCartAccess();
  return <CartProvider access={access}>{children}</CartProvider>;
}
