import { validateUserAddressFormInput } from './domain';
import type { UserAddressWriteDTO } from './dto';
import type { UserAddressRepository } from './repository';

export const USER_ADDRESS_LABEL_MAX_LENGTH = 30;

export interface UserAddressCreateInput {
  label: string;
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
  updateUserAddress(
    userId: string,
    addressId: string,
    input: UserAddressCreateInput,
  ): Promise<boolean>;
  setDefaultUserAddress(userId: string, addressId: string): Promise<boolean>;
  deleteUserAddress(userId: string, addressId: string): Promise<boolean>;
}

function toUserAddressWrite(
  input: UserAddressCreateInput,
): UserAddressWriteDTO | null {
  const validation = validateUserAddressFormInput(input);
  if (Object.values(validation).some(isValid => !isValid)) return null;

  const label = input.label.trim();
  if (label.length > USER_ADDRESS_LABEL_MAX_LENGTH) return null;

  return {
    label: label || null,
    recipient_name: input.recipientName.trim(),
    phone_number: input.phoneNumber,
    postal_code: input.postalCode.trim(),
    address_line_1: input.addressLine1.trim(),
    address_line_2: input.addressLine2.trim(),
    delivery_note: input.deliveryNote.trim() || null,
    is_default: input.isDefault,
  };
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
    const address = toUserAddressWrite(input);
    if (!address) return false;

    await userAddressRepository.create(userId, address);
    return true;
  }

  async function updateUserAddress(
    userId: string,
    addressId: string,
    input: UserAddressCreateInput,
  ): Promise<boolean> {
    const address = toUserAddressWrite(input);
    if (!address) return false;

    // Only an explicit request promotes; otherwise the DB keeps the current
    // flag, so a default switch made elsewhere is never overwritten.
    const { is_default: isDefaultRequested, ...fields } = address;
    return userAddressRepository.update(
      addressId,
      userId,
      isDefaultRequested ? address : fields,
    );
  }

  async function setDefaultUserAddress(
    userId: string,
    addressId: string,
  ): Promise<boolean> {
    return userAddressRepository.update(addressId, userId, {
      is_default: true,
    });
  }

  async function deleteUserAddress(
    userId: string,
    addressId: string,
  ): Promise<boolean> {
    const current = await userAddressRepository.findByIdAndUserId(
      addressId,
      userId,
    );
    if (!current || current.is_default) return false;

    return userAddressRepository.delete(addressId, userId);
  }

  return {
    createUserAddress,
    updateUserAddress,
    setDefaultUserAddress,
    deleteUserAddress,
  };
}
