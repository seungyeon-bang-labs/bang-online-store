'use server';

import {
  createUserAddress,
  currentUserRepository,
  type UserAddressCreateInput,
} from '@/domains/member';

export async function createMypageAddressAction(
  input: UserAddressCreateInput,
): Promise<boolean> {
  const user = await currentUserRepository.findCurrent();
  if (!user) return false;

  return createUserAddress(user.id, input);
}
