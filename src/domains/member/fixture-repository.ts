import { CURRENT_USER, USER_ADDRESSES } from './fixture';
import type {
  CurrentUserRepository,
  UserAddressRepository,
} from './repository';

let demoUserAddresses = USER_ADDRESSES.map(address => ({ ...address }));

export const fixtureCurrentUserRepository: CurrentUserRepository = {
  async findCurrent() {
    return { ...CURRENT_USER };
  },
};

export const fixtureUserAddressRepository: UserAddressRepository = {
  async create(address) {
    if (address.is_default) {
      demoUserAddresses = demoUserAddresses.map(current =>
        current.user_id === address.user_id
          ? { ...current, is_default: false }
          : current,
      );
    }
    demoUserAddresses = [{ ...address }, ...demoUserAddresses];
  },
  async findByUserId(userId) {
    return demoUserAddresses.filter(address => address.user_id === userId)
      .sort(
        (a, b) =>
          Number(b.is_default) - Number(a.is_default) ||
          b.created_at.localeCompare(a.created_at),
      )
      .map(address => ({ ...address }));
  },
  async findById(addressId) {
    const address = demoUserAddresses.find(item => item.id === addressId) ?? null;

    return address ? { ...address } : null;
  },
  async findByIdAndUserId(addressId, userId) {
    const address =
      demoUserAddresses.find(
        item => item.id === addressId && item.user_id === userId,
      ) ?? null;

    return address ? { ...address } : null;
  },
  async findDefaultByUserId(userId) {
    const address =
      demoUserAddresses.find(
        item => item.user_id === userId && item.is_default,
      ) ?? null;

    return address ? { ...address } : null;
  },
};
