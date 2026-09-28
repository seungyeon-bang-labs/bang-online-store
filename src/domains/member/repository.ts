import type { UserAddressDTO, UserDTO } from './dto';

export interface CurrentUserRepository {
  findCurrent(): Promise<UserDTO | null>;
}

export interface UserAddressRepository {
  create(address: UserAddressDTO): Promise<void>;
  findByUserId(userId: string): Promise<UserAddressDTO[]>;
  findById(addressId: string): Promise<UserAddressDTO | null>;
  findByIdAndUserId(
    addressId: string,
    userId: string,
  ): Promise<UserAddressDTO | null>;
  findDefaultByUserId(userId: string): Promise<UserAddressDTO | null>;
}
