import type { UserAddressDTO, UserDTO } from './member.dto';
import type {
  MemberProfileViewModel,
  UserAddressViewModel,
} from './member.view-model';

export const toMemberProfileViewModel = (
  user: UserDTO,
): MemberProfileViewModel => ({
  name: user.name,
  email: user.email,
  phoneNumber: user.phone_number,
  birthDate: user.birth_date ?? '',
});

export const toUserAddressViewModel = (
  address: UserAddressDTO,
): UserAddressViewModel => ({
  id: address.id,
  label: address.label,
  recipientName: address.recipient_name,
  phoneNumber: address.phone_number,
  postalCode: address.postal_code,
  addressText: [address.address_line_1, address.address_line_2]
    .filter(Boolean)
    .join(' '),
  deliveryNote: address.delivery_note,
  isDefault: address.is_default,
});
