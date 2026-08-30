import { CURRENT_USER, USER_ADDRESSES } from './fixture';
import type {
  CurrentUserRepository,
  UserAddressRepository,
} from './repository';

export const fixtureCurrentUserRepository: CurrentUserRepository = {
  async findCurrent() {
    return { ...CURRENT_USER };
  },
};

export const fixtureUserAddressRepository: UserAddressRepository = {
  async findByUserId(userId) {
    return USER_ADDRESSES.filter(address => address.user_id === userId)
      .sort(
        (a, b) =>
          Number(b.is_default) - Number(a.is_default) ||
          b.created_at.localeCompare(a.created_at),
      )
      .map(address => ({ ...address }));
  },
  async findById(addressId) {
    const address = USER_ADDRESSES.find(item => item.id === addressId) ?? null;

    return address ? { ...address } : null;
  },
  async findDefaultByUserId(userId) {
    const address =
      USER_ADDRESSES.find(
        item => item.user_id === userId && item.is_default,
      ) ?? null;

    return address ? { ...address } : null;
  },
};
