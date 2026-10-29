import type { CartCommand } from './contract';
import type { CartSnapshotDTO } from './dto';

export interface CartRepository {
  read(expectedUserId: string): Promise<CartSnapshotDTO>;
  apply(command: CartCommand): Promise<CartSnapshotDTO>;
}

export type CartRepositoryFailure =
  | 'access_changed'
  | 'invalid'
  | 'conflict'
  | 'retryable';

export class CartRepositoryError extends Error {
  constructor(public readonly kind: CartRepositoryFailure) {
    super('장바구니 요청을 처리하지 못했습니다.');
    this.name = 'CartRepositoryError';
  }
}
