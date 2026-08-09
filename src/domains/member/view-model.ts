export interface MemberProfileViewModel {
  loginId: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  phoneNumber: string;
  birthDate: string;
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
