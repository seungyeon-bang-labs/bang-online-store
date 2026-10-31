import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';
import type {
  MemberAccessRepository,
  MemberProfileRepository,
  UserAddressRepository,
} from './repository';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function createMemberAccessRepository(
  client: SupabaseClient<Database>,
): MemberAccessRepository {
  return {
    async findById(userId) {
      const { data, error } = await client
        .from('users')
        .select('id, status, deleted_at')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw new Error('회원 정보를 불러오지 못했습니다.', {
          cause: error,
        });
      }

      return data;
    },
  };
}

export function createMemberProfileRepository(
  client: SupabaseClient<Database>,
): MemberProfileRepository {
  return {
    async findById(userId) {
      const { data, error } = await client
        .from('users')
        .select('id, name, email, phone_number, email_verified_at')
        .eq('id', userId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .maybeSingle();

      if (error) {
        throw new Error('회원 정보를 불러오지 못했습니다.', {
          cause: error,
        });
      }

      return data;
    },
  };
}

// Writes rely on RLS for ownership and on DB triggers for the single-default rule.
export function createUserAddressRepository(
  client: SupabaseClient<Database>,
): UserAddressRepository {
  function readFailed(error: unknown): never {
    throw new Error('배송지를 불러오지 못했습니다.', { cause: error });
  }

  function writeFailed(error: unknown): never {
    throw new Error('배송지를 저장하지 못했습니다.', { cause: error });
  }

  return {
    async create(userId, address) {
      const { error } = await client
        .from('user_addresses')
        .insert({ ...address, user_id: userId });

      if (error) writeFailed(error);
    },
    async findByUserId(userId) {
      const { data, error } = await client
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })
        .order('id');

      if (error) readFailed(error);

      return data;
    },
    async findByIdAndUserId(addressId, userId) {
      if (!UUID_PATTERN.test(addressId)) return null;

      const { data, error } = await client
        .from('user_addresses')
        .select('*')
        .eq('id', addressId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) readFailed(error);

      return data;
    },
    async findDefaultByUserId(userId) {
      const { data, error } = await client
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle();

      if (error) readFailed(error);

      return data;
    },
    async update(addressId, userId, address) {
      if (!UUID_PATTERN.test(addressId)) return false;

      const { data, error } = await client
        .from('user_addresses')
        .update(address)
        .eq('id', addressId)
        .eq('user_id', userId)
        .select('id');

      if (error) writeFailed(error);

      return data.length > 0;
    },
    async delete(addressId, userId) {
      if (!UUID_PATTERN.test(addressId)) return false;

      const { data, error } = await client
        .from('user_addresses')
        .delete()
        .eq('id', addressId)
        .eq('user_id', userId)
        .select('id');

      if (error) writeFailed(error);

      return data.length > 0;
    },
  };
}
