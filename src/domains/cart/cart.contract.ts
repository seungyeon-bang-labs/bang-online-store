import type { CartViewModel } from './cart.view-model';

// Largest quantity the database column holds (int4).
export const maxCartQuantity = 2147483647;
// A cart request with no answer by then is cut off and handled as a lost reply, so one stuck request cannot lock the cart.
export const cartRequestTimeoutMs = 15_000;
export const cartRetryMessage =
  '장바구니를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.';

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
  | {
      kind: 'change_option';
      itemId: string;
      productId: number;
      variantId: number;
    }
  | { kind: 'remove_items'; itemIds: readonly string[] };

export type CartCommand = {
  version: 1;
  requestId: string;
  expectedUserId: string;
  operation: CartOperation;
};

export type CartNotice = {
  kind:
    | 'quantity_adjusted'
    | 'unavailable'
    | 'sold_out'
    | 'item_missing'
    | 'option_rejected';
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

export interface CartActionPort {
  resolveAccess(): Promise<CartAccess>;
  read(input: { expectedUserId: string }): Promise<CartReply>;
  mutate(command: CartCommand): Promise<CartReply>;
}
