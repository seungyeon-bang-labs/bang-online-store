import 'server-only';

import { unstable_rethrow } from 'next/navigation';
import { getCurrentMemberAccess, type MemberAccessResult } from '@/domains/auth/member-access.server';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';
import { productService } from '@/domains/product';
import type { CartAccess, CartReply } from '@/domains/cart/cart.contract';
import type { CartViewModel } from '@/domains/cart/cart.view-model';
import { CartRepositoryError } from '@/domains/cart/cart.repository';
import { createCartRepository } from '@/domains/cart/cart.supabase-repository.server';
import { createCartService } from '@/domains/cart/cart.service';
import { cartCommandSchema, cartReadSchema } from '@/domains/cart/cart.schema';

const retryMessage = '장바구니를 확인하지 못했습니다. 같은 요청으로 다시 시도해주세요.';

function toCartAccess(access: MemberAccessResult): CartAccess {
  switch (access.status) {
    case 'active': return { status: 'member', userId: access.member.id };
    case 'unauthenticated': return { status: 'guest' };
    case 'unverified': return { status: 'restricted', reason: 'unverified' };
    case 'missing': return { status: 'restricted', reason: 'missing' };
    case 'unavailable': return { status: 'restricted', reason: 'unavailable' };
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
        return access.status === 'error' ? { status: 'retryable', message: retryMessage } : { status: 'access_changed', access };
      }
      if (error.kind === 'invalid') return { status: 'invalid', message: '장바구니 요청 형식을 확인해주세요.' };
      if (error.kind === 'conflict') return { status: 'conflict', message: '기존 요청 내용과 일치하지 않습니다.' };
    }
    return { status: 'retryable', message: retryMessage };
  }
}

export async function readCart(input: unknown): Promise<CartReply> {
  const parsed = cartReadSchema.safeParse(input);
  if (!parsed.success) return { status: 'invalid', message: '장바구니 요청 형식을 확인해주세요.' };
  return execute(parsed.data.expectedUserId, service => service.read(parsed.data.expectedUserId));
}

export async function mutateCart(input: unknown): Promise<CartReply> {
  const parsed = cartCommandSchema.safeParse(input);
  if (!parsed.success) return { status: 'invalid', message: '장바구니 요청 형식을 확인해주세요.' };
  return execute(parsed.data.expectedUserId, service => service.apply(parsed.data));
}
