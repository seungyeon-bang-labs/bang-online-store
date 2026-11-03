import type { CartItemViewModel, CartViewModel } from '@/domains/cart/view-model';
import {
  toUserAddressFormViewModel,
  toUserAddressViewModel,
  type UserAddressDTO,
  type UserAddressFormViewModel,
  type UserAddressViewModel,
} from '@/domains/member';
import { getOrderAmounts, type OrderAmounts } from './domain';

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
    /** Null when none of the requested lines are in the cart. Lines are shown as they are; place_order checks stock. */
    async getCheckoutViewModel(
      userId: string,
      cartItemIds: readonly string[],
    ): Promise<CheckoutViewModel | null> {
      const requested = new Set(cartItemIds);
      const [cart, address] = await Promise.all([
        readCart(userId),
        findDefaultAddress(userId),
      ]);
      const items = cart.items.filter(item => requested.has(item.id));
      if (items.length === 0) return null;

      return {
        items,
        amounts: getOrderAmounts(items),
        address: toCheckoutAddress(address),
      };
    },
  };
}
