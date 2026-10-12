import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import { createMemberAccessRepository } from '@/domains/member/supabase-repository.server';
import type { MemberAccessDTO } from '@/domains/member/dto';
import type { MemberAccessRepository } from '@/domains/member/repository';

export type MemberAccessResult =
  | { status: 'active'; member: MemberAccessDTO }
  | { status: 'unverified'; email: string }
  | { status: 'unauthenticated' | 'unavailable' | 'missing' | 'error' };

export function createMemberAccessService(
  client: Pick<SupabaseClient<Database>, 'auth'>,
  repository: MemberAccessRepository,
) {
  return {
    async findCurrent(): Promise<MemberAccessResult> {
      try {
        const {
          data: { user },
          error,
        } = await client.auth.getUser();

        if (error) {
          const sessionInvalid =
            error.name === 'AuthSessionMissingError' ||
            error.status === 401 ||
            error.status === 403;
          return { status: sessionInvalid ? 'unauthenticated' : 'error' };
        }
        if (!user) return { status: 'unauthenticated' };
        if (!user.email) return { status: 'unavailable' };
        if (!user.email_confirmed_at) {
          return { status: 'unverified', email: user.email };
        }

        const member = await repository.findById(user.id);
        if (!member) return { status: 'missing' };
        if (member.status !== 'active' || member.deleted_at) {
          return { status: 'unavailable' };
        }
        return { status: 'active', member };
      } catch {
        return { status: 'error' };
      }
    },
  };
}

export async function getCurrentMemberAccess(): Promise<MemberAccessResult> {
  const client = await createAuthClient();
  return createMemberAccessService(
    client,
    createMemberAccessRepository(client),
  ).findCurrent();
}
