import type { CartViewModel } from './cart.view-model';

export type CartAccess =
  | { status: 'guest' }
  | { status: 'member'; userId: string }
  | { status: 'restricted'; reason: 'unverified' | 'missing' | 'unavailable' }
  | { status: 'error'; message: string };

export type CartLine = {
  id: string;
  productId: number;
  variantId: number;
  quantity: number;
};

export type CartProductInput = Omit<CartLine, 'id'>;

export type CartOperation =
  | { kind: 'merge_guest' | 'add_items'; items: readonly CartProductInput[] }
  | { kind: 'adjust_quantity'; itemId: string; delta: 1 | -1 }
  | { kind: 'change_option'; itemId: string; productId: number; variantId: number }
  | { kind: 'remove_items'; itemIds: readonly string[] };

export type CartCommand = {
  version: 1;
  requestId: string;
  expectedUserId: string;
  operation: CartOperation;
};

export type CartNotice = {
  // merge_returned is client-only (a rejected login merge is held for its account); the server schema never accepts it.
  kind: 'quantity_adjusted' | 'unavailable' | 'sold_out' | 'item_missing' | 'option_rejected' | 'merge_returned';
  variantId?: number;
  itemId?: string;
  before?: number;
  after?: number;
};

export type CartOperationResult = {
  requestId: string;
  outcome: 'applied' | 'noop' | 'rejected';
  itemIdMap: Record<string, string>;
  notices: readonly CartNotice[];
};

export type CartReply =
  | { status: 'ok'; cart: CartViewModel }
  | { status: 'access_changed'; access: CartAccess }
  | { status: 'retryable' | 'invalid' | 'conflict'; message: string };

// Transport options only; never serialized into a request body or RPC input.
export type CartRequestOptions = { signal?: AbortSignal };

export interface CartActionPort {
  resolveAccess(options?: CartRequestOptions): Promise<CartAccess>;
  read(input: { expectedUserId: string }, options?: CartRequestOptions): Promise<CartReply>;
  mutate(command: CartCommand, options?: CartRequestOptions): Promise<CartReply>;
}
