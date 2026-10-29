import type { CartNotice, CartOperationResult } from './contract';

export type CartItemDTO = {
  id: string;
  product_id: number;
  product_variant_id: number;
  quantity: number;
};

export type CartSnapshotDTO = {
  owner_id: string;
  cart_id: string;
  revision: string;
  items: readonly CartItemDTO[];
  notices: readonly CartNotice[];
  operation: CartOperationResult | null;
};
