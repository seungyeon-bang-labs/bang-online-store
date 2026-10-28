import type { ProductCartItemViewModel, ProductOptionViewModel } from '../product/view-model';
import type { CartNotice, CartOperationResult } from './cart.contract';

export type CartItemViewModel = ProductCartItemViewModel & {
  id: string;
  quantity: number;
  canSelect: boolean;
};

export type CartViewModel = {
  owner: { kind: 'guest' } | { kind: 'member'; userId: string };
  cartId: string | null;
  revision: string | null;
  items: readonly CartItemViewModel[];
  optionGroups: Record<number, readonly ProductOptionViewModel[]>;
  notices: readonly CartNotice[];
  operation: CartOperationResult | null;
};
