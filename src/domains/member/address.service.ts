import { validateUserAddressFormInput } from './domain';
import type { UserAddressDTO } from './dto';
import type { UserAddressRepository } from './repository';

export interface UserAddressCreateInput {
  recipientName: string;
  phoneNumber: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  deliveryNote: string;
  isDefault: boolean;
}

export interface UserAddressService {
  createUserAddress(
    userId: string,
    input: UserAddressCreateInput,
  ): Promise<boolean>;
}

export function createUserAddressService({
  userAddressRepository,
}: {
  userAddressRepository: UserAddressRepository;
}): UserAddressService {
  async function createUserAddress(
    userId: string,
    input: UserAddressCreateInput,
  ): Promise<boolean> {
    const validation = validateUserAddressFormInput(input);
    if (Object.values(validation).some(isValid => !isValid)) return false;

    const createdAt = new Date().toISOString();
    const address: UserAddressDTO = {
      id: crypto.randomUUID(),
      user_id: userId,
      label: '',
      recipient_name: input.recipientName.trim(),
      phone_number: input.phoneNumber,
      postal_code: input.postalCode.trim(),
      address_line_1: input.addressLine1.trim(),
      address_line_2: input.addressLine2.trim() || null,
      delivery_note: input.deliveryNote.trim() || null,
      is_default: input.isDefault,
      created_at: createdAt,
      updated_at: createdAt,
    };
    await userAddressRepository.create(address);
    return true;
  }

  return { createUserAddress };
}
