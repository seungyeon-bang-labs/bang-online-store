'use server';

import { revalidatePath } from 'next/cache';
import { requireActiveMember } from '@/app/(auth)/require-active-member';

import {
  createUserAddressService,
  type UserAddressCreateInput,
} from '@/domains/member';
import { createUserAddressRepository } from '@/domains/member/supabase-repository.server';
import { getMypageAddressHref } from '@/shared/lib/mypage-routes';
import { createAuthClient } from '@/shared/lib/supabase/auth-server';

async function getUserAddressService() {
  const client = await createAuthClient();

  return createUserAddressService({
    userAddressRepository: createUserAddressRepository(client),
  });
}

function revalidateAddressPages(isChanged: boolean): boolean {
  if (isChanged) revalidatePath(getMypageAddressHref());

  return isChanged;
}

export async function createMypageAddressAction(
  input: UserAddressCreateInput,
): Promise<boolean> {
  const user = await requireActiveMember();
  const service = await getUserAddressService();

  return revalidateAddressPages(
    await service.createUserAddress(user.id, input),
  );
}

export async function updateMypageAddressAction(
  addressId: string,
  input: UserAddressCreateInput,
): Promise<boolean> {
  const user = await requireActiveMember();
  const service = await getUserAddressService();

  return revalidateAddressPages(
    await service.updateUserAddress(user.id, addressId, input),
  );
}

export async function setDefaultMypageAddressAction(
  addressId: string,
): Promise<boolean> {
  const user = await requireActiveMember();
  const service = await getUserAddressService();

  return revalidateAddressPages(
    await service.setDefaultUserAddress(user.id, addressId),
  );
}

export async function deleteMypageAddressAction(
  addressId: string,
): Promise<boolean> {
  const user = await requireActiveMember();
  const service = await getUserAddressService();

  return revalidateAddressPages(
    await service.deleteUserAddress(user.id, addressId),
  );
}
