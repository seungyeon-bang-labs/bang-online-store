import type { UserAddressDTO, UserDTO } from './dto';

export interface CurrentUserRepository {
  findCurrent(): Promise<UserDTO | null>;
}

export interface UserAddressRepository {
  findByUserId(userId: string): Promise<UserAddressDTO[]>;
  findById(addressId: string): Promise<UserAddressDTO | null>;
  findDefaultByUserId(userId: string): Promise<UserAddressDTO | null>;
}
