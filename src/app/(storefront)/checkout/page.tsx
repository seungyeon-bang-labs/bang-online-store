import { redirect } from 'next/navigation';
import { requireActiveMember } from '@/app/(auth)/require-active-member';
import {
  createMypageAddressAction,
  updateMypageAddressAction,
} from '@/app/(mypage)/mypage/address/actions';
import { createCartRepository } from '@/domains/cart/repository';
import { createCartService } from '@/domains/cart/service';
import { createUserAddressRepository } from '@/domains/member/supabase-repository.server';
import { createCheckoutService } from '@/domains/order/checkout.service';
import { productService } from '@/domains/product';
import { CheckoutPageClient } from '@/features/checkout/checkout-page-client';
import { getCartHref } from '@/shared/lib/cart-routes';
import { parseCheckoutItemIds } from '@/shared/lib/checkout-routes';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import { placeOrderAction } from './actions';

interface CheckoutPageProps {
  searchParams: Promise<{ items?: string | string[] }>;
}

async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const [{ items }, member] = await Promise.all([
    searchParams,
    requireActiveMember(),
  ]);
  const cartItemIds = parseCheckoutItemIds(items);
  if (cartItemIds.length === 0) redirect(getCartHref());

  const client = await createAuthClient();
  const cartService = createCartService({
    repository: createCartRepository(client),
    products: productService,
    now: () => new Date(),
  });
  const addressRepository = createUserAddressRepository(client);
  const checkout = await createCheckoutService({
    readCart: userId => cartService.read(userId),
    findDefaultAddress: userId => addressRepository.findDefaultByUserId(userId),
  }).getCheckoutViewModel(member.id, cartItemIds);
  if (!checkout) redirect(getCartHref());

  return (
    <CheckoutPageClient
      checkout={checkout}
      requestId={crypto.randomUUID()}
      placeOrder={placeOrderAction}
      createAddress={createMypageAddressAction}
      updateAddress={updateMypageAddressAction}
    />
  );
}

export default CheckoutPage;
