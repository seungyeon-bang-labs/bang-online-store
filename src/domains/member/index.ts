export * from './dto';
export * from './domain';
export * from './address.service';
export * from './mapper';
export * from './repository';
export * from './view-model';

export {
  fixtureCurrentUserRepository as currentUserRepository,
  fixtureUserAddressRepository as userAddressRepository,
} from './fixture-repository';

import { createUserAddressService } from './address.service';
import { fixtureUserAddressRepository } from './fixture-repository';

const userAddressService = createUserAddressService({
  userAddressRepository: fixtureUserAddressRepository,
});

export const createUserAddress = userAddressService.createUserAddress;
