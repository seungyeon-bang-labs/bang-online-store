import type { UserAddressDTO } from './dto';

type UserAddressTextSource = Pick<
  UserAddressDTO,
  'address_line_1' | 'address_line_2'
>;

type UserAddressDisplayNameSource = Pick<
  UserAddressDTO,
  'label' | 'address_line_1'
>;

export function getUserAddressText(
  address: UserAddressTextSource,
): string {
  return [address.address_line_1, address.address_line_2]
    .filter(Boolean)
    .join(' ');
}

export function getUserAddressDisplayName(
  address: UserAddressDisplayNameSource,
): string {
  return address.label.trim() || address.address_line_1;
}
