import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';
import type {
  MemberAccessRepository,
  MemberProfileRepository,
} from './repository';

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
