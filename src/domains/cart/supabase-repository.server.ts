import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/shared/types/supabase';
import { CartRepositoryError, type CartRepository } from './repository';
import {
  cartCommandSchema,
  cartReadSchema,
  parseCartSnapshot,
} from './schema';

function decode(value: unknown, ownerId: string, requestId?: string) {
  try {
    const snapshot = parseCartSnapshot(value);
    if (
      snapshot.owner_id.toLowerCase() !== ownerId.toLowerCase() ||
      (requestId === undefined
        ? snapshot.operation !== null
        : snapshot.operation?.requestId.toLowerCase() !==
          requestId.toLowerCase())
    ) {
      throw new Error('Unmatched cart response');
    }
    return snapshot;
  } catch {
    throw new CartRepositoryError('retryable');
  }
}

function rejectRpc(error: { code: string; message: string }): never {
  if (error.code === 'P0001' && error.message === 'CART_REQUEST_CONFLICT')
    throw new CartRepositoryError('conflict');
  if (error.code === '42501' && error.message === 'CART_ACCESS_DENIED')
    throw new CartRepositoryError('access_changed');
  if (error.code === '22023' && error.message === 'CART_INVALID_OPERATION')
    throw new CartRepositoryError('invalid');
  throw new CartRepositoryError('retryable');
}

export function createCartRepository(
  client: SupabaseClient<Database>,
): CartRepository {
  return {
    async read(expectedUserId) {
      const input = cartReadSchema.parse({ expectedUserId });
      const { data, error } = await client.rpc('get_cart', {
        p_expected_user_id: input.expectedUserId,
      });
      if (error) rejectRpc(error);
      return decode(data, input.expectedUserId);
    },
    async apply(input) {
      const command = cartCommandSchema.parse(input);
      
      const payload: Json = JSON.parse(
        JSON.stringify({
          version: command.version,
          operation: command.operation,
        }),
      );
      const { data, error } = await client.rpc('apply_cart_operation', {
        p_expected_user_id: command.expectedUserId,
        p_request_id: command.requestId,
        p_operation: payload,
      });
      if (error) rejectRpc(error);
      return decode(data, command.expectedUserId, command.requestId);
    },
  };
}
