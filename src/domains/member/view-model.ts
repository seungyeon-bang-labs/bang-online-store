import type { UserGender } from './dto';

export interface MemberProfileViewModel {
  name: string;
  email: string;
  isEmailVerified: boolean;
  phoneNumber: string;
  birthDate: string;
  gender: UserGender;
}

export interface UserAddressViewModel {
  id: string;
  displayName: string;
  recipientName: string;
  phoneNumber: string;
  postalCode: string;
  formattedAddress: string;
  deliveryNote: string | null;
  isDefault: boolean;
}

export interface UserAddressFormViewModel {
  id: string;
  recipientName: string;
  phoneNumber: string;
  postalCode: string;
  addressLine1: string;
  addressLine2: string;
  deliveryNote: string;
  isDefault: boolean;
}
