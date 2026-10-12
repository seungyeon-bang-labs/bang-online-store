import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';
import type { MemberAccessRepository } from './repository';

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