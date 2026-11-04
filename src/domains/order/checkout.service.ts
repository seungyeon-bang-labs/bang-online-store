import type { CartItemViewModel, CartViewModel } from '@/domains/cart/view-model';
import {
  toUserAddressFormViewModel,
  toUserAddressViewModel,
  type UserAddressDTO,
  type UserAddressFormViewModel,
  type UserAddressViewModel,
} from '@/domains/member';
import { getOrderAmounts, type OrderAmounts } from './domain';
import type { PlaceOrderRejection } from './place-order';

// place_order rejects an address without a detail line, so the checkout asks for it first.
export type CheckoutAddress =
  | { status: 'ready'; address: UserAddressViewModel; label: string | null }
  | { status: 'incomplete'; address: UserAddressFormViewModel }
  | { status: 'missing' };

export interface CheckoutViewModel {
  items: readonly CartItemViewModel[];
  amounts: OrderAmounts;
  address: CheckoutAddress;
}

// The page shows only the popup that sends the customer back to the cart.
export interface CheckoutRefusal {
  refused: Extract<PlaceOrderRejection, 'product_unavailable'>;
}

function toCheckoutAddress(address: UserAddressDTO | null): CheckoutAddress {
  if (!address) return { status: 'missing' };
  if (!address.address_line_2?.trim()) {
    return { status: 'incomplete', address: toUserAddressFormViewModel(address) };
  }

  return {
    status: 'ready',
    address: toUserAddressViewModel(address),
    label: address.label?.trim() || null,
  };
}

export function createCheckoutService({
  readCart,
  findDefaultAddress,
}: {
  readCart(userId: string): Promise<CartViewModel>;
  findDefaultAddress(userId: string): Promise<UserAddressDTO | null>;
}) {
  return {
    /**
     * Null when none of the requested lines are in the cart. A discontinued line has no price to show, so it is
     * refused up front the way place_order would refuse it. Other lines are shown as they are; place_order checks stock.
     */
    async getCheckoutViewModel(
      userId: string,
      cartItemIds: readonly string[],
    ): Promise<CheckoutViewModel | CheckoutRefusal | null> {
      const requested = new Set(cartItemIds);
      const [cart, address] = await Promise.all([
        readCart(userId),
        findDefaultAddress(userId),
      ]);
      const items = cart.items.filter(item => requested.has(item.id));
      if (items.length === 0) return null;
      if (items.some(item => item.discontinued)) return { refused: 'product_unavailable' };

      return {
        items,
        amounts: getOrderAmounts(items),
        address: toCheckoutAddress(address),
      };
    },
  };
}
