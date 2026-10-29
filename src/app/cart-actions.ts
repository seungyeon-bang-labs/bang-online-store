import 'server-only';

import { unstable_rethrow } from 'next/navigation';
import { getCurrentMemberAccess, type MemberAccessResult } from '@/domains/auth/member-access.server';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import { productService } from '@/domains/product';
import { cartInvalidMessage as invalidMessage, cartRetryMessage as retryMessage, type CartAccess, type CartReply } from '@/domains/cart/contract';
import type { CartViewModel } from '@/domains/cart/view-model';
import { CartRepositoryError } from '@/domains/cart/repository';
import { createCartRepository } from '@/domains/cart/supabase-repository.server';
import { createCartService } from '@/domains/cart/service';
import { cartCommandSchema, cartReadSchema } from '@/domains/cart/schema';


function toCartAccess(access: MemberAccessResult): CartAccess {
  switch (access.status) {
    case 'active': return { status: 'member', userId: access.member.id };
    case 'unauthenticated': return { status: 'guest' };
    case 'unverified':
    case 'missing':
    case 'unavailable': return { status: 'restricted' };
    case 'error': return { status: 'error', message: retryMessage };
  }
}

export async function resolveCartAccess(): Promise<CartAccess> {
  try {
    return toCartAccess(await getCurrentMemberAccess());
  } catch (error) {
    unstable_rethrow(error);
    return { status: 'error', message: retryMessage };
  }
}

type CartService = ReturnType<typeof createCartService>;

async function execute(expectedUserId: string, run: (service: CartService) => Promise<CartViewModel>): Promise<CartReply> {
  try {
    const access = await resolveCartAccess();
    if (access.status === 'error') return { status: 'retryable', message: retryMessage };
    if (access.status !== 'member' || access.userId.toLowerCase() !== expectedUserId.toLowerCase()) {
      return { status: 'access_changed', access };
    }
    const client = await createAuthClient();
    const service = createCartService({ repository: createCartRepository(client), products: productService, now: () => new Date() });
    return { status: 'ok', cart: await run(service) };
  } catch (error) {
    unstable_rethrow(error);
    if (error instanceof CartRepositoryError) {
      if (error.kind === 'access_changed') {
        const access = await resolveCartAccess();
        // The session still names this member while the database refuses it (e.g. drifted email_verified_at):
        // reporting a change would make the client restart and ask again forever.
        const sameMember = access.status === 'member' && access.userId.toLowerCase() === expectedUserId.toLowerCase();
        return access.status === 'error' || sameMember ? { status: 'retryable', message: retryMessage } : { status: 'access_changed', access };
      }
      if (error.kind === 'invalid') return { status: 'invalid', message: invalidMessage };
      if (error.kind === 'conflict') return { status: 'conflict', message: '기존 요청 내용과 일치하지 않습니다.' };
    }
    return { status: 'retryable', message: retryMessage };
  }
}

export async function readCart(input: unknown): Promise<CartReply> {
  const parsed = cartReadSchema.safeParse(input);
  if (!parsed.success) return { status: 'invalid', message: invalidMessage };
  return execute(parsed.data.expectedUserId, service => service.read(parsed.data.expectedUserId));
}

export async function mutateCart(input: unknown): Promise<CartReply> {
  const parsed = cartCommandSchema.safeParse(input);
  if (!parsed.success) return { status: 'invalid', message: invalidMessage };
  return execute(parsed.data.expectedUserId, service => service.apply(parsed.data));
}
