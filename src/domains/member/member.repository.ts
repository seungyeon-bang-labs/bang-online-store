import type { UserAddressDTO, UserDTO } from './member.dto';

export interface CurrentUserRepository {
  findCurrent(): Promise<UserDTO | null>;
}

export interface UserAddressRepository {
  findByUserId(userId: string): Promise<UserAddressDTO[]>;
  findDefaultByUserId(userId: string): Promise<UserAddressDTO | null>;
}
