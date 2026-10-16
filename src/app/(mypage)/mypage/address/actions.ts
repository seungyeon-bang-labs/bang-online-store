'use server';

import { requireActiveMember } from '@/app/(auth)/require-active-member';

import {
  createUserAddress,
  type UserAddressCreateInput,
} from '@/domains/member';

export async function createMypageAddressAction(
  input: UserAddressCreateInput,
): Promise<boolean> {
  const user = await requireActiveMember();

  return createUserAddress(user.id, input);
}
