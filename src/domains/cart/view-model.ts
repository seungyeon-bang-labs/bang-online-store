import type { ProductCartItemViewModel, ProductOptionViewModel } from '../product/view-model';
import type { CartNotice, CartOperationResult } from './contract';

export type CartItemViewModel = ProductCartItemViewModel & {
  id: string;
  quantity: number;
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
