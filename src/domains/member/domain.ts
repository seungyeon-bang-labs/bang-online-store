import { AsYouType, isValidPhoneNumber } from 'libphonenumber-js/min';
import type { UserAddressDTO } from './dto';

export interface UserAddressFormInput {
  recipientName: string;
  phoneNumber: string;
  postalCode: string;
  addressLine1: string;
}

export interface UserAddressFormValidationResult {
  isRecipientNameValid: boolean;
  isPhoneNumberValid: boolean;
  isPostalCodeValid: boolean;
  isAddressLine1Valid: boolean;
}

const KOREAN_POSTAL_CODE_PATTERN = /^\d{5}$/;

export function formatKoreanPhoneNumber(value: string): string {
  return new AsYouType('KR').input(value);
}

export function validateUserAddressFormInput({
  recipientName,
  phoneNumber,
  postalCode,
  addressLine1,
}: UserAddressFormInput): UserAddressFormValidationResult {
  return {
    isRecipientNameValid: recipientName.trim().length > 0,
    isPhoneNumberValid: isValidPhoneNumber(phoneNumber, 'KR'),
    isPostalCodeValid: KOREAN_POSTAL_CODE_PATTERN.test(postalCode.trim()),
    isAddressLine1Valid: addressLine1.trim().length > 0,
  };
}

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
