import type {
  UserAddressDTO,
  UserAddressWriteDTO,
  UserDTO,
  MemberAccessDTO,
  MemberProfileDTO,
} from './dto';

export interface CurrentUserRepository {
  findCurrent(): Promise<UserDTO | null>;
}

export interface UserAddressRepository {
  create(userId: string, address: UserAddressWriteDTO): Promise<void>;
  findByUserId(userId: string): Promise<UserAddressDTO[]>;
  findByIdAndUserId(
    addressId: string,
    userId: string,
  ): Promise<UserAddressDTO | null>;
  findDefaultByUserId(userId: string): Promise<UserAddressDTO | null>;
  update(
    addressId: string,
    userId: string,
    address: Partial<UserAddressWriteDTO>,
  ): Promise<boolean>;
  delete(addressId: string, userId: string): Promise<boolean>;
}

export interface MemberAccessRepository {
  findById(userId: string): Promise<MemberAccessDTO | null>;
}

export interface MemberProfileRepository {
  findById(userId: string): Promise<MemberProfileDTO | null>;
}
