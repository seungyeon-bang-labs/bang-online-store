import type { UserAddressDTO, UserDTO } from './dto';
import {
  getUserAddressDisplayName,
  getUserAddressText,
} from './domain';
import type {
  MemberProfileViewModel,
  UserAddressFormViewModel,
  UserAddressViewModel,
} from './view-model';

export const toMemberProfileViewModel = (
  user: UserDTO,
): MemberProfileViewModel => ({
  name: user.name,
  email: user.email,
  isEmailVerified: user.email_verified_at !== null,
  phoneNumber: user.phone_number,
  birthDate: user.birth_date ?? '',
  gender: user.gender,
});

export const toUserAddressViewModel = (
  address: UserAddressDTO,
): UserAddressViewModel => ({
  id: address.id,
  displayName: getUserAddressDisplayName(address),
  recipientName: address.recipient_name,
  phoneNumber: address.phone_number,
  postalCode: address.postal_code,
  formattedAddress: getUserAddressText(address),
  deliveryNote: address.delivery_note,
  isDefault: address.is_default,
});

export const toUserAddressFormViewModel = (
  address: UserAddressDTO,
): UserAddressFormViewModel => ({
  id: address.id,
  recipientName: address.recipient_name,
  phoneNumber: address.phone_number,
  postalCode: address.postal_code,
  addressLine1: address.address_line_1,
  addressLine2: address.address_line_2 ?? '',
  deliveryNote: address.delivery_note ?? '',
  isDefault: address.is_default,
});
